"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { GeoSearchControl, OpenStreetMapProvider } from "leaflet-geosearch";
import "leaflet-geosearch/dist/geosearch.css";
import { Project, ConflictFinding, CitizenReport } from "@/lib/types";

// helper to create colored marker icons
const createColoredIcon = (color: string) => {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
};

const blueIcon = createColoredIcon("blue");       // Ongoing works
const redIcon = createColoredIcon("red");         // Delayed works / high clash
const orangeIcon = createColoredIcon("orange");   // Planned works
const greenIcon = createColoredIcon("green");     // Completed
const violetIcon = createColoredIcon("violet");   // Citizen crowdsourced reports
const yellowIcon = createColoredIcon("gold");     // Selected highlight

// handles map pan/zoom and click events
function MapEventHandler({
  center,
  onMapClick,
}: {
  center: [number, number] | null;
  onMapClick?: (coords: [number, number]) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.flyTo(center, 15, { duration: 1.2 });
    }
  }, [center, map]);

  useEffect(() => {
    const provider = new OpenStreetMapProvider();
    const searchControl = GeoSearchControl({
      provider: provider,
      style: "bar",
      showMarker: false,
      retainZoomLevel: false,
      animateZoom: true,
      autoClose: true,
      searchLabel: "Search street or landmark...",
      keepResult: true,
    });
    map.addControl(searchControl as any);
    return () => {
      map.removeControl(searchControl as any);
    };
  }, [map]);

  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick([Number(e.latlng.lat.toFixed(5)), Number(e.latlng.lng.toFixed(5))]);
      }
    },
  });

  return null;
}

type MapProps = {
  projects: Project[];
  conflicts: ConflictFinding[];
  citizenReports?: CitizenReport[];
  selectedProjectId: string | null;
  onSelectProject: (id: string) => void;
  onMapClick?: (coords: [number, number]) => void;
  onUpvoteReport?: (id: string) => void;
};

export default function CivicMap({
  projects,
  conflicts,
  citizenReports = [],
  selectedProjectId,
  onSelectProject,
  onMapClick,
  onUpvoteReport,
}: MapProps) {
  // Default map center (Downtown)
  let center: [number, number] = [40.7128, -74.0060];
  let zoom = 14;

  const selectedProj = projects.find((p) => p.id === selectedProjectId);
  if (selectedProj && selectedProj.latitude && selectedProj.longitude) {
    center = [selectedProj.latitude, selectedProj.longitude];
    zoom = 15;
  } else if (projects.length > 0) {
    const validProjs = projects.filter((p) => p.latitude && p.longitude);
    if (validProjs.length > 0) {
      center = [validProjs[0].latitude!, validProjs[0].longitude!];
    }
  }

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full z-0 font-sans"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapEventHandler
          center={
            selectedProj && selectedProj.latitude && selectedProj.longitude
              ? [selectedProj.latitude, selectedProj.longitude]
              : null
          }
          onMapClick={onMapClick}
        />

        {/* 1. Public Infrastructure Projects Markers */}
        {projects.map((proj) => {
          if (!proj.latitude || !proj.longitude) return null;

          const isSelected = proj.id === selectedProjectId;
          const hasClash = conflicts.some((c) => c.projectIds.includes(proj.id));

          let icon = blueIcon;
          if (isSelected) {
            icon = yellowIcon;
          } else if (proj.status === "delayed" || hasClash) {
            icon = redIcon;
          } else if (proj.status === "planned") {
            icon = orangeIcon;
          } else if (proj.status === "completed") {
            icon = greenIcon;
          }

          return (
            <Marker
              key={proj.id}
              position={[proj.latitude, proj.longitude]}
              icon={icon}
              eventHandlers={{
                click: () => onSelectProject(proj.id),
              }}
            >
              <Popup>
                <div className="font-sans flex flex-col gap-1.5 p-1 min-w-[210px]">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        proj.status === "delayed"
                          ? "bg-red-100 text-red-700"
                          : proj.status === "ongoing"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {proj.status}
                    </span>
                    <span className="text-[10px] text-gray-500 capitalize">{proj.workType}</span>
                  </div>

                  <h3 className="font-semibold text-sm leading-tight text-gray-900">
                    {proj.title}
                  </h3>

                  <p className="text-xs text-gray-600 line-clamp-2">{proj.description}</p>

                  <div className="text-[11px] text-gray-500 border-t border-gray-100 pt-1 mt-1">
                    <div>🏢 {proj.department || "Municipal Dept"}</div>
                    <div>📍 {proj.addressText}</div>
                    {hasClash && (
                      <div className="text-red-600 font-semibold mt-0.5 flex items-center gap-1">
                        ⚠️ Cross-Department Conflict Detected!
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => onSelectProject(proj.id)}
                    className="mt-1 w-full text-center text-xs bg-slate-900 text-white hover:bg-slate-800 py-1 rounded font-medium transition"
                  >
                    Inspect in Detail →
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* 2. Crowdsourced Citizen Reports Markers */}
        {citizenReports.map((report) => {
          if (!report.latitude || !report.longitude) return null;

          return (
            <Marker
              key={report.id}
              position={[report.latitude, report.longitude]}
              icon={violetIcon}
            >
              <Popup>
                <div className="font-sans flex flex-col gap-1.5 p-1 min-w-[220px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">
                      📢 Citizen Report
                    </span>
                    <span className="text-[11px] text-gray-500 font-medium">
                      👍 {report.upvotes} upvotes
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-gray-900">{report.title}</h3>
                  <p className="text-xs text-gray-600">{report.description}</p>

                  <div className="text-[11px] text-gray-500 border-t border-gray-100 pt-1">
                    <div>📍 {report.addressText}</div>
                    <div className="capitalize">🏷️ Category: {report.category.replace("_", " ")}</div>
                  </div>

                  {onUpvoteReport && (
                    <button
                      onClick={() => onUpvoteReport(report.id)}
                      className="mt-1 w-full text-center text-xs bg-purple-600 hover:bg-purple-700 text-white py-1 rounded font-medium transition flex items-center justify-center gap-1"
                    >
                      👍 Upvote Issue ({report.upvotes})
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Map Legend Overlay for judges & citizens */}
      <div className="absolute bottom-4 left-4 z-[500] bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-2.5 shadow-md text-xs font-sans max-w-[260px]">
        <div className="font-bold text-gray-800 mb-1.5 flex items-center justify-between">
          <span>Map Legend</span>
          <span className="text-[10px] text-gray-400 font-normal">Click map to pin</span>
        </div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-gray-700">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Ongoing
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Delayed / Clash
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span> Planned
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span> Completed
          </div>
          <div className="flex items-center gap-1.5 col-span-2 pt-0.5 border-t border-gray-100">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span> 📢 Citizen Observation
          </div>
        </div>
      </div>
    </div>
  );
}
