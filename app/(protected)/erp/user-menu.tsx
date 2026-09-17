"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { ChevronDown, LogOut } from "lucide-react";
import styles from "./user-menu.module.css";

export function UserMenu() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("Usuario");
  const [isLoading, setIsLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout>();
  const lastActivityRef = useRef<number>(Date.now());

  // Obtener email del usuario actual
  useEffect(() => {
    async function fetchUser() {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
    }
    fetchUser();
  }, []);

  // Temporizador de inactividad (5 horas)
  const INACTIVITY_TIMEOUT = 5 * 60 * 60 * 1000; // 5 horas en ms

  const resetInactivityTimer = () => {
    lastActivityRef.current = Date.now();
    
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    inactivityTimerRef.current = setTimeout(() => {
      handleLogout();
    }, INACTIVITY_TIMEOUT);
  };

  // Escuchar actividad del usuario
  useEffect(() => {
    const events = ["mousemove", "keydown", "click", "scroll"];
    
    events.forEach((event) => {
      window.addEventListener(event, resetInactivityTimer, true);
    });

    resetInactivityTimer();

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, resetInactivityTimer, true);
      });
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, []);

  // Cerrar menú si se hace clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  async function handleLogout() {
    setIsLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      setIsLoading(false);
    }
  }

  return (
    <div className={styles.userMenuContainer} ref={menuRef}>
      <button
        className={styles.userMenuTrigger}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        type="button"
      >
        <span>Admin: {userEmail.split("@")[0]}</span>
        <ChevronDown size={16} className={styles.chevron} aria-hidden="true" />
      </button>

      {isOpen && (
        <div className={styles.userMenuDropdown} role="menu">
          <div className={styles.userMenuHeader}>
            <span className={styles.userEmail}>{userEmail}</span>
            <span className={styles.userRole}>Administrador</span>
          </div>

          <div className={styles.userMenuDivider} />

          <button
            className={styles.userMenuLogout}
            onClick={handleLogout}
            disabled={isLoading}
            type="button"
            role="menuitem"
          >
            <LogOut size={16} aria-hidden="true" />
            <span>{isLoading ? "Cerrando sesión..." : "Cerrar sesión"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
