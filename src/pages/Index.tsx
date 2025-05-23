
import React from "react";
import Home from "./Home";

export default function Index() {
  console.log("Index component rendering Home");
  return (
    <>
      {/* Debug element to confirm Index component is rendering */}
      <div className="fixed top-0 left-0 bg-purple-600 text-white p-4 z-[100000] font-bold">
        INDEX WRAPPER RENDERED
      </div>
      <Home />
    </>
  );
}
