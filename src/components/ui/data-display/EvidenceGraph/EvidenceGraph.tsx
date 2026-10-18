"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { Evidence } from "@/lib/types";
import s from "./EvidenceGraph.module.css";
export function EvidenceGraph({
  evidence,
  label,
  hint,
  unavailable,
}: {
  evidence: Evidence[];
  label: string;
  hint: string;
  unavailable: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const holder = container.current;
    if (!holder) return;
    const element: HTMLDivElement = holder;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setFailed(true);
      return;
    }
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 2, 12);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    element.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = false;
    controls.minDistance = 3;
    controls.maxDistance = 30;
    const objects: THREE.Object3D[] = [];
    const historical = getComputedStyle(element)
      .getPropertyValue("--accent")
      .trim();
    const modern = getComputedStyle(element)
      .getPropertyValue("--secondary")
      .trim();
    evidence.slice(0, 120).forEach((source, index) => {
      const angle = index * 2.39996;
      const radius = 1 + Math.sqrt(index) * 0.4;
      const point = new THREE.Vector3(
        Math.cos(angle) * radius,
        (source.source === "historical" ? -1 : 1) + Math.sin(index) * 0.35,
        Math.sin(angle) * radius,
      );
      const geometry = new THREE.SphereGeometry(0.13, 16, 12);
      const material = new THREE.MeshBasicMaterial({
        color: source.source === "historical" ? historical : modern,
      });
      const node = new THREE.Mesh(geometry, material);
      node.position.copy(point);
      scene.add(node);
      objects.push(node);
    });

    function render() {
      renderer.render(scene, camera);
    }
    function resize() {
      const width = element.clientWidth;
      const height = element.clientHeight;
      renderer.setSize(width, height);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
      render();
    }
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    controls.addEventListener("change", render);
    resize();
    return () => {
      observer.disconnect();
      controls.dispose();
      objects.forEach((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
          object.geometry.dispose();
          object.material.dispose();
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [evidence]);
  return (
    <section className={s.graph}>
      <div ref={container} role="img" aria-label={label} />
      <p>{failed ? unavailable : hint}</p>
    </section>
  );
}
