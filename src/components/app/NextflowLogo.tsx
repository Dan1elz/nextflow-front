import NextflowLogoSvg from "@/assets/nextflow-logo.svg";

interface NextflowLogoProps {
  className?: string;
}

export function NextflowLogo({ className }: NextflowLogoProps) {
  return <img src={NextflowLogoSvg} alt="Nextflow" className={className} />;
}
