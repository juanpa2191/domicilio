"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useCart } from "@/lib/cart/store";
import { Home, ShoppingBag, User, ShoppingCart } from "lucide-react";

const TABS = [
  { href: "/cliente", label: "Inicio", Icon: Home },
  { href: "/cliente/carrito", label: "Carrito", Icon: ShoppingCart },
  { href: "/cliente/mis-pedidos", label: "Mis pedidos", Icon: ShoppingBag },
  { href: "/cliente/cuenta", label: "Cuenta", Icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const itemsCount = useCart((s) => s.items.length);

  return (
    <nav className="sticky bottom-0 z-10 border-t bg-background">
      <ul className="mx-auto flex max-w-md justify-around">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          const isCart = href === "/cliente/carrito";
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 text-xs",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <div className="relative">
                  <Icon className="size-5" />
                  {isCart && itemsCount > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                      {itemsCount}
                    </span>
                  )}
                </div>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
