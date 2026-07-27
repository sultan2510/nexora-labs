export default function Logo({ withWordmark = true, size = 40 }) {
  return (
    <div className="flex items-center gap-3">
      <svg width={size} height={size} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Nexora Labs">
        <polygon points="20,20 60,20 60,180 20,180" fill="#E11D2E" />
        <polygon points="140,20 180,20 180,180 140,180" fill="#E11D2E" />
        <polygon points="20,20 60,20 180,180 140,180" fill="#E11D2E" />
      </svg>
      {withWordmark && (
        <div className="leading-none">
          <div className="font-extrabold text-lg tracking-wide text-white">NEXORA</div>
          <div className="text-[10px] font-semibold tracking-[0.3em] text-red -mt-0.5">LABS</div>
        </div>
      )}
    </div>
  );
}
