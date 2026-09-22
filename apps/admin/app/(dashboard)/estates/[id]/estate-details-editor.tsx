"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { updateEstateDetails } from "@/lib/actions";

const AMENITY_GROUPS = [
  {
    label: "Utilities",
    items: [
      "Road Access",
      "Electricity",
      "Solar Power",
      "Generator Backup",
      "Water Supply / Borehole",
      "Drainage System",
      "Internet / Fibre",
    ],
  },
  {
    label: "Security",
    items: [
      "Perimeter Fencing",
      "Security Gate",
      "CCTV Surveillance",
      "Security Post",
      "24/7 Security",
    ],
  },
  {
    label: "Estate Features",
    items: [
      "Swimming Pool",
      "Garden / Landscaping",
      "Gym / Fitness Centre",
      "Air Conditioning",
      "Elevator / Lift",
      "Smart Home System",
    ],
  },
  {
    label: "Community Facilities",
    items: [
      "Golf Course",
      "Club House",
      "Children's Playground",
      "Sports Court",
      "Shopping Complex",
      "School",
      "Place of Worship",
      "Hospital / Clinic",
    ],
  },
  {
    label: "Services",
    items: ["Waste Management", "Estate Management", "Laundry Services"],
  },
];

interface Props {
  estateId: string;
  initialAmenities: string[];
  initialMapUrl: string | null;
  initialLatitude: string | null;
  initialLongitude: string | null;
}

export function EstateDetailsEditor({ estateId, initialAmenities, initialMapUrl, initialLatitude, initialLongitude }: Props) {
  const [amenities, setAmenities] = useState<Set<string>>(new Set(initialAmenities));
  const [mapUrl, setMapUrl] = useState(initialMapUrl ?? "");
  const [latitude, setLatitude] = useState(initialLatitude ?? "");
  const [longitude, setLongitude] = useState(initialLongitude ?? "");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleAmenity(key: string) {
    setAmenities((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    setSaved(false);
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateEstateDetails(estateId, {
        amenities: [...amenities],
        mapUrl: mapUrl.trim() || undefined,
        latitude: latitude.trim() || undefined,
        longitude: longitude.trim() || undefined,
      });
      if (result.error) {
        setError(result.error);
      } else {
        setSaved(true);
        setError(null);
      }
    });
  }

  return (
    <div className="rounded-md border bg-card p-5 space-y-6">
      <div>
        <h3 className="text-sm font-semibold">Location Map &amp; Amenities</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Set the Google Maps URL and toggle what&apos;s available at this estate.
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      {/* Location */}
      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium">Location &amp; Map</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Enter coordinates directly, or paste a Google Maps URL and they will be auto-extracted.
            Coordinates take priority when both are set.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="estate-lat">Latitude</Label>
            <Input
              id="estate-lat"
              value={latitude}
              onChange={(e) => { setLatitude(e.target.value); setSaved(false); }}
              placeholder="e.g. 9.0538"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="estate-lng">Longitude</Label>
            <Input
              id="estate-lng"
              value={longitude}
              onChange={(e) => { setLongitude(e.target.value); setSaved(false); }}
              placeholder="e.g. 7.4928"
            />
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="estate-map-url">Google Maps URL <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <Input
            id="estate-map-url"
            value={mapUrl}
            onChange={(e) => { setMapUrl(e.target.value); setSaved(false); }}
            placeholder="Paste a Google Maps link to this location…"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          To get coordinates: open Google Maps, right-click on the exact location, and copy the lat/lng shown at the top of the menu.
        </p>
      </div>

      {/* Amenities */}
      <div className="space-y-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Amenities &amp; Facilities
        </p>
        {AMENITY_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              {group.label}
            </p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              {group.items.map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <Checkbox
                    id={`estate-amenity-${item}`}
                    checked={amenities.has(item)}
                    onCheckedChange={() => toggleAmenity(item)}
                  />
                  <Label
                    htmlFor={`estate-amenity-${item}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {item}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving…" : "Save"}
        </Button>
        {saved && (
          <span className="text-sm text-green-600">Saved</span>
        )}
      </div>
    </div>
  );
}
