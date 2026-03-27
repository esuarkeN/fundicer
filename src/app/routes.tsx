import { Route, Routes } from "react-router-dom";
import { HomePage } from "@/pages/HomePage";
import { D10Room } from "@/pages/rooms/D10Room";
import { D12Room } from "@/pages/rooms/D12Room";
import { D20Room } from "@/pages/rooms/D20Room";
import { D4Room } from "@/pages/rooms/D4Room";
import { D6Room } from "@/pages/rooms/D6Room";
import { D8Room } from "@/pages/rooms/D8Room";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/d4" element={<D4Room />} />
      <Route path="/d6" element={<D6Room />} />
      <Route path="/d8" element={<D8Room />} />
      <Route path="/d10" element={<D10Room />} />
      <Route path="/d12" element={<D12Room />} />
      <Route path="/d20" element={<D20Room />} />
      <Route path="/d20/:puzzleId" element={<D20Room />} />
      <Route path="*" element={<HomePage />} />
    </Routes>
  );
}
