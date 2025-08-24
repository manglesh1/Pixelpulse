
"use client"
import { useMemo, Fragment } from "react";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

const BottomBreadcrumb = ({ className }:{className:string}) => {
  const pathname = usePathname();

  const segments = useMemo(() => {
    return (pathname || "/").split("/").filter(Boolean);
  }, [pathname]);

  const items = useMemo(() => {
    let acc = "";
    return segments.map((seg) => {
      acc += `/${seg}`;
      return { label: seg, href: acc };
    });
  }, [segments]);

  if (!segments.length) return null;

  return (
    <div className = {cn(className)}>
      <div className="mx-auto flex h-14 max-w-screen-2xl items-center px-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            {items.map((item, i) => (
              <Fragment key={item.href}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
                </BreadcrumbItem>
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </div>
  );
}

export default BottomBreadcrumb;