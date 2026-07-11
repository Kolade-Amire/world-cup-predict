import { teamFlagCode } from "@/lib/flags";

type CountryFlagVariant = "badge" | "inline";

const FLAG_VARIANTS: Record<
  CountryFlagVariant,
  { flagImage: string; avatarWrapper: string; avatarText: string }
> = {
  badge: {
    flagImage: "h-7 w-10 rounded-[4px] object-cover md:h-8 md:w-12",
    avatarWrapper:
      "h-8 w-8 md:h-9 md:w-9 rounded-xl bg-pitch-deep/60 shadow-md border border-white/10",
    avatarText: "text-[10px] md:text-xs rounded-xl",
  },
  inline: {
    flagImage: "h-3.5 w-5 rounded-[2px] object-cover",
    avatarWrapper:
      "h-4 w-5 rounded-[4px] bg-pitch-deep/60 shadow-sm border border-white/10",
    avatarText: "text-[7px] rounded-[4px]",
  },
};

// Initials-avatar fallback for teams without a mapped flag (TBD slots, unmapped names).
function getCountryAvatar(name: string | null | undefined) {
  if (!name) {
    return {
      initials: "TBD",
      gradient: "from-neutral-800 to-neutral-900 text-neutral-500 border border-pitch-border/30",
    };
  }

  const cleanName = name.replace(/[^a-zA-Z\s]/g, "").trim();
  const words = cleanName.split(/\s+/).filter(Boolean);
  let initials = "";
  if (words.length >= 2) {
    initials = (words[0][0] + words[1][0]).toUpperCase();
  } else if (words.length === 1 && words[0].length >= 2) {
    initials = words[0].slice(0, 2).toUpperCase();
  } else {
    initials = name.slice(0, 2).toUpperCase();
  }

  // Curated country gradients based on national colors
  const gradients: Record<string, string> = {
    NIGERIA: "from-emerald-600 to-green-800 text-white",
    BRAZIL: "from-yellow-400 to-yellow-600 text-yellow-950",
    ARGENTINA: "from-sky-400 to-blue-500 text-white",
    ENGLAND: "from-red-500 to-blue-700 text-white",
    FRANCE: "from-blue-600 to-blue-900 text-white",
    GERMANY: "from-neutral-800 to-neutral-600 text-white",
    SPAIN: "from-red-600 to-yellow-500 text-white",
    ITALY: "from-blue-500 to-blue-800 text-white",
    PORTUGAL: "from-red-700 to-green-700 text-white",
    MOROCCO: "from-red-600 to-green-800 text-white",
    JAPAN: "from-blue-800 to-red-600 text-white",
    USA: "from-blue-600 via-red-500 to-white text-blue-950",
    "UNITED STATES": "from-blue-600 via-red-500 to-white text-blue-950",
    NETHERLANDS: "from-orange-500 to-orange-700 text-white",
    BELGIUM: "from-red-600 via-yellow-500 to-neutral-800 text-white",
    CROATIA: "from-red-600 to-blue-600 text-white",
    SENEGAL: "from-green-600 via-yellow-500 to-red-600 text-white",
    CAMEROON: "from-green-700 via-red-600 to-yellow-500 text-white",
    GHANA: "from-red-600 via-yellow-500 to-green-600 text-white",
    URUGUAY: "from-sky-400 to-white text-sky-950",
    MEXICO: "from-green-700 via-white to-red-600 text-green-950",
    CANADA: "from-red-600 to-white text-red-950",
    TUNISIA: "from-red-600 to-red-800 text-white",
  };

  const key = cleanName.toUpperCase();
  let gradient = gradients[key];
  if (!gradient) {
    const fallbackGradients = [
      "from-pink-600 to-rose-800 text-white",
      "from-purple-600 to-indigo-800 text-white",
      "from-blue-600 to-sky-800 text-white",
      "from-cyan-600 to-teal-800 text-white",
      "from-emerald-600 to-green-800 text-white",
      "from-yellow-500 to-amber-700 text-yellow-950",
      "from-orange-500 to-red-700 text-white",
      "from-fuchsia-600 to-purple-800 text-white",
    ];
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = key.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash % fallbackGradients.length);
    gradient = fallbackGradients[idx];
  }

  return { initials, gradient };
}

// Country flag from flagcdn.com, falling back to the initials avatar when the team
// name isn't mapped. Variants keep the layout footprint consistent across call sites.
export default function CountryFlag({
  name,
  variant,
}: {
  name: string | null | undefined;
  variant: CountryFlagVariant;
}) {
  const classes = FLAG_VARIANTS[variant];
  const code = name ? teamFlagCode(name) : null;

  if (code) {
    return (
      <img
        src={`https://flagcdn.com/w40/${code}.png`}
        srcSet={`https://flagcdn.com/w40/${code}.png 1x, https://flagcdn.com/w80/${code}.png 2x`}
        alt=""
        loading="lazy"
        decoding="async"
        className={`select-none shrink-0 ${classes.flagImage}`}
      />
    );
  }

  const { initials, gradient } = getCountryAvatar(name);
  return (
    <span
      className={`inline-flex items-center justify-center font-black bg-gradient-to-br select-none shrink-0 ${gradient} ${classes.avatarText} ${classes.avatarWrapper}`}
    >
      {initials}
    </span>
  );
}
