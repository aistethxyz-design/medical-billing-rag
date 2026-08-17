/**
 * Responsive sources for the film's photography.
 *
 * Each plate ships as WebP at three widths; the browser picks one. The original
 * PNGs are not bundled — they were 1.6–2.0 MB each and nothing needs them.
 */
import heroOts960 from "@/assets/hero-ots-960.webp";
import heroOts1440 from "@/assets/hero-ots-1440.webp";
import heroOts1920 from "@/assets/hero-ots-1920.webp";
import patient960 from "@/assets/patient-warm-960.webp";
import patient1440 from "@/assets/patient-warm-1440.webp";
import patient1920 from "@/assets/patient-warm-1920.webp";
import consult960 from "@/assets/consult-warm-960.webp";
import consult1440 from "@/assets/consult-warm-1440.webp";
import consult1920 from "@/assets/consult-warm-1920.webp";
import glasses960 from "@/assets/glasses-hero-960.webp";
import glasses1440 from "@/assets/glasses-hero-1440.webp";
import glasses1920 from "@/assets/glasses-hero-1920.webp";

export type Plate = { src: string; srcSet: string };

const plate = (a: string, b: string, c: string): Plate => ({
  src: b,
  srcSet: `${a} 960w, ${b} 1440w, ${c} 1920w`,
});

export const HERO_OTS = plate(heroOts960, heroOts1440, heroOts1920);
export const PATIENT_WARM = plate(patient960, patient1440, patient1920);
export const CONSULT_WARM = plate(consult960, consult1440, consult1920);
export const GLASSES_HERO = plate(glasses960, glasses1440, glasses1920);
