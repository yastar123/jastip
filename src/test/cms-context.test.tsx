import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { AuthProvider } from "@/lib/auth-context";
import { CMSProvider, useCMS } from "@/lib/cms-context";
import { DEFAULT_CMS_DATA } from "@/lib/cms-defaults";
import { type AppCMSData } from "@/lib/cms-types";

function CMSContent() {
  const { data } = useCMS();
  return (
    <>
      <p>{data.services[0]?.name}</p>
      <p>{data.home.gallerySlides?.[0]?.title}</p>
    </>
  );
}

describe("CMS initial data", () => {
  it("uses server-rendered CMS data instead of a stale localStorage copy", async () => {
    const cachedData = structuredClone(DEFAULT_CMS_DATA);
    cachedData.services[0]!.name = "Cached service";
    cachedData.home.gallerySlides = [
      { id: "cached", title: "Cached announcement", description: "", image: "cached-image" },
    ];
    localStorage.setItem("jastip_anggun_cms_v1", JSON.stringify(cachedData));

    const serverData: AppCMSData = structuredClone(DEFAULT_CMS_DATA);
    serverData.services[0]!.name = "Server service";
    serverData.home.gallerySlides = [
      { id: "server", title: "Server announcement", description: "", image: "server-image" },
    ];
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise<Response>(() => {})),
    );

    const container = document.createElement("div");
    const root = createRoot(container);
    try {
      await act(async () => {
        root.render(
          <AuthProvider>
            <CMSProvider initialData={serverData}>
              <CMSContent />
            </CMSProvider>
          </AuthProvider>,
        );
      });

      expect(container.textContent).toContain("Server service");
      expect(container.textContent).toContain("Server announcement");
      expect(container.textContent).not.toContain("Cached service");
      expect(container.textContent).not.toContain("Cached announcement");
    } finally {
      await act(async () => root.unmount());
      container.remove();
      vi.unstubAllGlobals();
    }
  });
});
