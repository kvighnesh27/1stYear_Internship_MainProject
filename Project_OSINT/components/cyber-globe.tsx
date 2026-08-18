"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export function CyberGlobe({ compact = false }: { compact?: boolean }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = compact ? 4.2 : 3.7;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    host.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.25, 48, 48),
      new THREE.MeshBasicMaterial({ color: 0x0b2944, wireframe: true, transparent: true, opacity: 0.52 })
    );
    group.add(sphere);

    const ringMaterial = new THREE.LineBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.55 });
    for (let i = 0; i < 7; i += 1) {
      const points: THREE.Vector3[] = [];
      const radius = 1.38 + i * 0.025;
      for (let j = 0; j <= 140; j += 1) {
        const angle = (j / 140) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.28, Math.sin(angle) * 0.08));
      }
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), ringMaterial);
      line.rotation.x = i * 0.42;
      line.rotation.y = i * 0.32;
      group.add(line);
    }

    const beaconGeometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    for (let i = 0; i < 90; i += 1) {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      const r = 1.28;
      vertices.push(r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi));
    }
    beaconGeometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    const beacons = new THREE.Points(
      beaconGeometry,
      new THREE.PointsMaterial({ color: 0x67e8f9, size: 0.028, transparent: true, opacity: 0.95 })
    );
    group.add(beacons);

    const beam = new THREE.Mesh(
      new THREE.ConeGeometry(0.18, 2.6, 36, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.12, side: THREE.DoubleSide })
    );
    beam.position.y = 0.6;
    beam.rotation.z = -0.7;
    group.add(beam);

    const resize = () => {
      const rect = host.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height);
      camera.aspect = rect.width / Math.max(rect.height, 1);
      camera.updateProjectionMatrix();
    };

    let raf = 0;
    const animate = () => {
      group.rotation.y += 0.004;
      beacons.rotation.y -= 0.002;
      beam.rotation.y += 0.012;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };

    resize();
    animate();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      renderer.dispose();
      host.removeChild(renderer.domElement);
    };
  }, [compact]);

  return <div ref={hostRef} className="h-full min-h-[280px] w-full" />;
}
