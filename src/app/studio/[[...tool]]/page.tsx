"use client";

import dynamic from "next/dynamic";

const Studio = dynamic(() => import("./Studio").then((mod) => mod.Studio), {
  ssr: false,
});

export default function StudioPage() {
  return <Studio />;
}
