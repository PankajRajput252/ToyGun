import sclar from "../components/images/HeroIMG.jpg";

export default function HeroBanner() {
  return (
    <section className="w-full mt-[120px] flex justify-center">
      <img
        src={sclar}
        alt="Banner"
        className="w-full max-w-6xl h-auto max-h-[900px] object-contain"
      />
    </section>
  );
}