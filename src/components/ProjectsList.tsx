"use client";

import { useState, useEffect } from "react";
import { mockProjects } from "@/lib/mockProjects";
import type { Project } from "@/types/project";

export default function ProjectsList() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    // ✅ Try to fetch API first, but use mock data if none found
    async function loadProjects() {
      try {
        // Example: replace with your real API call
        const res = await fetch("/api/projects");
        if (!res.ok) throw new Error("Failed to fetch projects");
        const data = await res.json();

        if (data && data.length > 0) {
          setProjects(data);
        } else {
          console.warn("No API projects found — using mock data");
          setProjects(mockProjects);
        }
      } catch (error) {
        console.error("Error loading projects:", error);
        setProjects(mockProjects);
      }
    }

    loadProjects();
  }, []);

  if (!projects || projects.length === 0) {
    return (
      <div className="text-center text-gray-500 py-10">
        No projects found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <div
          key={project.id}
          className="bg-white rounded-2xl shadow p-4 hover:shadow-lg transition"
        >
          <img
            src={project.thumbnail_url || "/placeholder.svg"}
            alt={project.title}
            className="w-full h-48 object-cover rounded-xl"
          />
          <h3 className="mt-3 text-lg font-semibold">{project.title}</h3>
          <p className="text-sm text-gray-600 line-clamp-2">
            {project.description}
          </p>
          <div className="mt-2 text-xs text-gray-400">
            {project.location?.name || "Unknown location"}
          </div>
        </div>
      ))}
    </div>
  );
}
