export type GeoPosition = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
};

export class GeolocationError extends Error {
  code: "denied" | "unavailable" | "timeout" | "unsupported";

  constructor(
    code: GeolocationError["code"],
    message: string
  ) {
    super(message);
    this.name = "GeolocationError";
    this.code = code;
  }
}

const GEO_TIMEOUT_MS = 15_000;

export function geolocationErrorMessage(err: unknown): string {
  if (err instanceof GeolocationError) {
    switch (err.code) {
      case "denied":
        return "Accès refusé. Activez la localisation dans les paramètres du téléphone ou du navigateur, puis réessayez.";
      case "unavailable":
        return "Position indisponible. Vérifiez que le GPS est activé et que vous avez du réseau.";
      case "timeout":
        return "Délai dépassé pour obtenir la position. Réessayez en plein air ou près d'une fenêtre.";
      case "unsupported":
        return "Ce navigateur ne prend pas en charge la géolocalisation.";
    }
  }
  return "Impossible d'obtenir votre position GPS.";
}

export function requestGeolocation(): Promise<GeoPosition> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      reject(
        new GeolocationError(
          "unsupported",
          "La géolocalisation n'est pas disponible sur cet appareil."
        )
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy ?? null,
        });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(
            new GeolocationError(
              "denied",
              "La géolocalisation est désactivée ou refusée."
            )
          );
          return;
        }
        if (err.code === err.POSITION_UNAVAILABLE) {
          reject(
            new GeolocationError(
              "unavailable",
              "Position GPS indisponible pour le moment."
            )
          );
          return;
        }
        if (err.code === err.TIMEOUT) {
          reject(
            new GeolocationError(
              "timeout",
              "Délai dépassé pour obtenir la position."
            )
          );
          return;
        }
        reject(
          new GeolocationError(
            "unavailable",
            "Erreur lors de la lecture GPS."
          )
        );
      },
      {
        enableHighAccuracy: true,
        timeout: GEO_TIMEOUT_MS,
        maximumAge: 0,
      }
    );
  });
}
