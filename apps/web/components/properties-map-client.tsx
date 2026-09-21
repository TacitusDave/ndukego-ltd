"use client";

import { useEffect, useRef } from "react";
import { mediaUrl } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import "leaflet/dist/leaflet.css";

export interface MapProperty {
  id: string;
  title: string;
  listingPrice: string | null;
  latitude: number;
  longitude: number;
  coverUrl?: string | null;
}

interface Props {
  properties: MapProperty[];
}

const RED_DOT_ICON_HTML = `
  <div style="
    background: #A0111C;
    width: 22px; height: 22px;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(160,17,28,0.5);
    cursor: pointer;
  "></div>
`;

export function PropertiesMapClient({ properties }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Destroy existing map before re-initialising (e.g. when properties list changes)
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    let cancelled = false;

    import("leaflet").then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        center: [9.05, 7.49],
        zoom: 12,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;

      const dotIcon = L.divIcon({
        html: RED_DOT_ICON_HTML,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
        popupAnchor: [0, -14],
        className: "",
      });

      const markers: import("leaflet").Marker[] = [];

      for (const prop of properties) {
        const imgTag = prop.coverUrl
          ? `<img src="${mediaUrl(prop.coverUrl)}" style="width:100%;height:110px;object-fit:cover;border-radius:6px 6px 0 0;display:block;" alt="" />`
          : "";

        const priceText = prop.listingPrice
          ? formatCurrency(prop.listingPrice)
          : "Price on request";

        const popupHtml = `
          <div style="width:210px;font-family:system-ui,sans-serif;overflow:hidden;border-radius:6px;">
            ${imgTag}
            <div style="padding:10px 2px 4px">
              <p style="font-weight:700;font-size:13px;margin:0 0 3px;line-height:1.3;color:#111">${prop.title}</p>
              <p style="color:#A0111C;font-weight:700;font-size:13px;margin:0 0 10px">${priceText}</p>
              <a href="/properties/${prop.id}"
                style="display:inline-block;background:#A0111C;color:white;padding:5px 14px;border-radius:5px;text-decoration:none;font-size:12px;font-weight:600;">
                View property →
              </a>
            </div>
          </div>
        `;

        const marker = L.marker([prop.latitude, prop.longitude], { icon: dotIcon });
        marker.bindPopup(popupHtml, { maxWidth: 220, className: "property-popup" });
        marker.addTo(map);
        markers.push(marker);
      }

      if (markers.length > 0) {
        const latLngs = properties.map((p) =>
          L.latLng(p.latitude, p.longitude)
        );
        const bounds = L.latLngBounds(latLngs);
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
      }
    });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [properties]);

  return <div ref={containerRef} className="w-full h-full" />;
}
