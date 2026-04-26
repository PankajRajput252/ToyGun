import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { useState } from "react";
import "leaflet/dist/leaflet.css";

type Props = {
    coords: { lat: number; lng: number };
    onSelect: (data: {
        lat: number;
        lng: number;
        address: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    }) => void;
};

function LocationMarker({ coords, onSelect }: any) {
  const [position, setPosition] = useState<any>(null);

  useMapEvents({
    async click(e) {
      const { lat, lng } = e.latlng;
      setPosition(e.latlng);

      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await res.json();

      onSelect({
        lat,
        lng,
        address: data.display_name,
        city: data.address.city || data.address.town || "",
        state: data.address.state || "",
        zip: data.address.postcode || "",
        country: data.address.country || "",
      });
    },
  });

  return position || coords.lat ? (
    <Marker position={position || [coords.lat, coords.lng]} />
  ) : null;
}

export default function MapPicker({ coords, onSelect }: Props) {
  return (
    <MapContainer
      center={[coords.lat || 20.5937, coords.lng || 78.9629]}
      zoom={coords.lat ? 13 : 5}
      key={`${coords.lat}-${coords.lng}`}
      className="h-64 w-full rounded-lg"
    >
      <TileLayer
        attribution="&copy; OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocationMarker coords={coords} onSelect={onSelect} />
    </MapContainer>
  );
}