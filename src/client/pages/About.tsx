import aboutBanner from "@/assets/about-banner.jpg";

const About = () => {
  return (
    <main className="min-h-screen">
      {/* Banner Section */}
      <section className="relative h-[80vh] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${aboutBanner})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background" />
        </div>

        <div className="relative z-10 h-full flex items-center justify-center">
          <h1 className="font-playfair text-5xl md:text-6xl font-bold text-center animate-fade-in">
            Crafted with grace,
            <br />
            <span className="text-gradient-rose">worn with confidence</span>
          </h1>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-24 px-4 bg-gradient-champagne">
        <div className="container mx-auto max-w-4xl">
          <div className="space-y-8 animate-fade-in transition-transform duration-500 hover:-translate-y-1">
            <div>
              <h2 className="font-playfair text-3xl md:text-4xl font-semibold mb-6 text-center">
                Our Story
              </h2>
              <div className="w-24 h-1 bg-gradient-rose mx-auto rounded-full mb-8" />
            </div>

            <h3 className="text-2xl font-playfair text-center mb-6">The Art of Silver</h3>

            <p className="text-lg text-foreground/90 leading-relaxed text-center">
              XIVI began as a small dream, built on love and a deep appreciation for timeless 925 silver. Every piece is handcrafted in pure silver, shaped slowly and thoughtfully—because we believe beauty deserves time.
            </p>

            <p className="text-lg text-foreground/90 leading-relaxed text-center">
              Our artisans blend traditional craftsmanship with modern design, creating jewellery that feels personal, effortless, and lasting. At XIVI, we don't just create jewellery—we create pieces that become part of your story.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-5xl">
          <h2 className="font-playfair text-3xl md:text-4xl font-semibold mb-4 text-center">
            What We Stand For
          </h2>
          <div className="w-24 h-1 bg-gradient-rose mx-auto rounded-full mb-16" />

          <div className="grid md:grid-cols-3 gap-10">
            <div className="group text-center animate-fade-in rounded-2xl border border-transparent bg-white/60 backdrop-blur-sm px-6 py-10 transition-all duration-500 hover:-translate-y-2 hover:border-primary/30 hover:shadow-glow">
              <div className="w-16 h-16 bg-gradient-rose rounded-full mx-auto mb-6 flex items-center justify-center shadow-soft transition-transform duration-500 group-hover:scale-110">
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="font-playfair text-xl font-semibold mb-3">
                925 Pure Silver
              </h3>
              <p className="text-muted-foreground">
                Only the highest quality 925 sterling silver
              </p>
            </div>

            <div className="group text-center animate-fade-in rounded-2xl border border-transparent bg-white/60 backdrop-blur-sm px-6 py-10 transition-all duration-500 hover:-translate-y-2 hover:border-primary/30 hover:shadow-glow" style={{ animationDelay: "100ms" }}>
              <div className="w-16 h-16 bg-gradient-rose rounded-full mx-auto mb-6 flex items-center justify-center shadow-soft transition-transform duration-500 group-hover:scale-110">
                <span className="text-2xl">🔨</span>
              </div>
              <h3 className="font-playfair text-xl font-semibold mb-3">
                Handcrafted
              </h3>
              <p className="text-muted-foreground">
                Each piece is made with artisan precision
              </p>
            </div>

            <div className="group text-center animate-fade-in rounded-2xl border border-transparent bg-white/60 backdrop-blur-sm px-6 py-10 transition-all duration-500 hover:-translate-y-2 hover:border-primary/30 hover:shadow-glow" style={{ animationDelay: "200ms" }}>
              <div className="w-16 h-16 bg-gradient-rose rounded-full mx-auto mb-6 flex items-center justify-center shadow-soft transition-transform duration-500 group-hover:scale-110">
                <span className="text-2xl">⏳</span>
              </div>
              <h3 className="font-playfair text-xl font-semibold mb-3">
                Timeless
              </h3>
              <p className="text-muted-foreground">
                Designs that transcend fleeting trends
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quote Section */}
      <section className="py-24 px-4 bg-secondary/20">
        <div className="container mx-auto max-w-3xl text-center animate-fade-in">
          <blockquote className="font-playfair text-2xl md:text-3xl italic font-light text-primary mb-6 transition-transform duration-500 hover:scale-[1.02]">
            "Jewelry is not an accessory.
            <br />
            It's a reflection of the woman who wears it."
          </blockquote>
          <div className="w-16 h-1 bg-primary mx-auto rounded-full" />
        </div>
      </section>
    </main>
  );
};

export default About;
