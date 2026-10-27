# Store listing (draft) — App Store Connect & Google Play

App Store character limits in brackets. English is the primary language; add Spanish (Spain) as a localization.

---

## English (primary)

- **Name** [30]: PollenBee: Pollen ID for Bees
- **Subtitle** [30]: Which flowers feed your bees?
- **Promotional text** [170]: Snap a bee coming home with pollen and see which plants it's foraging — with odds, your area's bloom calendar and a history of every hive visit.
- **Keywords** [100]: beekeeping,pollen,bees,honey,apiary,beekeeper,flowers,bloom,forage,plants,hive,apiculture
- **Description:**

  Ever wondered where your bees' pollen comes from?

  Take a photo of a bee returning to the hive with its pollen loads. PollenBee looks at the pollen colour and cross-checks it with your location, the date and time, the weather and the plants recorded in bloom near you — then shows you which plants it's most likely from, with probabilities.

  • Photo analysis: the likely plant sources of the pollen, ranked by probability, with the expected pollen colour and bloom months.
  • Always an estimate: even if the photo is blurry or the pollen isn't visible, you get an estimate from what blooms in your area on that date.
  • Edit place and time: perfect for photos taken earlier — the date and location are read from the photo when available.
  • Your area: an at-a-glance pollen colour palette, a bloom curve for the whole year and the key plants for bees each month.
  • History by area: every analysis saved and grouped by apiary location.
  • No sign-up: start straight away. Delete your data from the app at any time.

  PollenBee gives an informative estimate; it does not replace a laboratory pollen analysis.

- **Support URL:** [https://www.floresstudio.app/...]
- **Privacy policy URL:** https://www.floresstudio.app/legal/polenbee-privacy
- **Category:** Primary: Utilities (or Education). Secondary: Lifestyle.
- **Age rating:** 4+ (no objectionable content).

## Español (España)

- **Nombre** [30]: PolenBee: polen de tus abejas
- **Subtítulo** [30]: ¿Qué flores visitan tus abejas?
- **Texto promocional** [170]: Fotografía una abeja cargada de polen y descubre qué plantas está pecoreando, con probabilidades, el calendario de floración de tu zona y tu historial.
- **Palabras clave** [100]: apicultura,polen,abejas,miel,colmena,apicultor,flores,floración,pecoreo,plantas,colmenar
- **Descripción:**

  ¿Te has preguntado de dónde viene el polen de tus abejas?

  Haz una foto a una abeja que vuelve a la colmena con las cargas de polen. PolenBee mira el color del polen y lo cruza con tu ubicación, la fecha y la hora, el tiempo y las plantas registradas en flor cerca de ti, y te dice de qué plantas viene con más probabilidad.

  • Análisis de foto: las plantas de origen más probables, ordenadas por probabilidad, con el color de polen esperado y los meses de floración.
  • Siempre hay estimación: aunque la foto salga borrosa o no se vea el polen, te damos una estimación con lo que florece en tu zona en esa fecha.
  • Lugar y hora editables: ideal para fotos antiguas; la fecha y la ubicación se leen de la propia foto cuando es posible.
  • Tu zona: la paleta de colores de polen de un vistazo, la curva de floración de todo el año y las plantas clave para las abejas cada mes.
  • Historial por zonas: cada análisis guardado y agrupado por la ubicación del colmenar.
  • Sin registro: empieza al momento y borra tus datos desde la app cuando quieras.

  PolenBee da una estimación orientativa; no sustituye un análisis palinológico de laboratorio.

---

## App Privacy (App Store Connect) — suggested answers

Data used to track you: **No**.

| Data type | Purpose | Linked to user | Notes |
|---|---|---|---|
| Location → Precise location | App Functionality | Yes (anonymous user ID) | Saved with each analysis |
| User Content → Photos or Videos | App Functionality | No | Sent for analysis, not stored by us |
| Identifiers → User ID | App Functionality | Yes | Anonymous Supabase ID |
| Usage Data → Product Interaction | Analytics | No | PostHog |
| Diagnostics → Crash Data | App Functionality | No | Only once Sentry is enabled |

## Google Play — Data safety (same data)
Collected: approximate & precise location, photos, app interactions, crash logs (once Sentry is on), user IDs. Shared with third parties for processing: photos (OpenAI), location (iNaturalist, Open-Meteo, Photon). Encrypted in transit: yes. Users can request deletion: yes (in app).

---

## TestFlight / App Review notes

- No account or login: the app creates an anonymous session automatically.
- To test without bees: choose any photo from the gallery — the app always returns an estimate (based on location and date if no pollen is visible).
- Location permission is optional; reviewers can pick a place by hand ("Choose where your bees are").
- "Delete my data" is at the bottom of the History screen.

**What to Test (TestFlight):** Take or pick a bee photo, check/edit place and time, run the analysis. Open "Your area" from the home card and browse months on the bloom curve. Try History and "Delete my data".

## Still needed
- Screenshots: 6.9" iPhone (1320×2868 or 1290×2796), and Play phone screenshots. Suggested set: onboarding, home with "Your area" card, review step, result, "Your area" screen, history.
- Support URL and contact email.
