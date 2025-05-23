
import React from "react";
import Home from "./Home";

export default function Index() {
  console.log("Index component rendering Home");
  return (
    <div className="index-wrapper">
      <Home />
    </div>
  );
}
