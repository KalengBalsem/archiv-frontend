"use client"

import { useEffect, useState } from "react"
import { supabaseClient } from "@/utils/supabaseClient"
import { Project } from "@/types/project"
import ProjectCard from "@/components/project-card"
import LayoutWrapper from "@/components/layout-wrapper"
import { Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { mockProjects } from "@/lib/mockProjects" // 👈 add this

export default function HomePage() {
  return (
    <LayoutWrapper>
      <p>ARCH-IV home page</p>
    </LayoutWrapper>
  )
}
