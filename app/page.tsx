import { CurrentWeather } from "@/components/weather";

export default function Home() {
  return (
    <main
      className="relative flex min-h-screen flex-col items-center justify-center bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `linear-gradient(rgba(10, 15, 10, 0.6), rgba(10, 15, 10, 0.6)), url('/images/trails/default-trail.webp')`,
      }}
    >
      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-text-primary sm:text-[4rem]">
          RainCheck
        </h1>
        <p className="mt-4 text-lg text-text-primary/80 sm:text-xl">
          Weather-aware half-marathon training
        </p>

        <div className="mt-8">
          <CurrentWeather />
        </div>
      </div>
    </main>
  );
}
