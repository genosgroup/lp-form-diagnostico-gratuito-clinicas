/* eslint-disable @next/next/no-img-element */

export default function Logo({ className = "" }: { className?: string }) {
  return <img src="/images/logo-genos.png" alt="Genos Group" width={313} height={120} className={`block w-auto max-w-full object-contain object-left ${className}`} />;
}
