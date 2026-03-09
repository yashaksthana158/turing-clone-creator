import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { MapPin, Phone, Mail, ExternalLink } from "lucide-react";

const aboutImages = [
  "/Assets/About/1.jpg",
  "/Assets/About/2.JPG",
  "/Assets/About/3.JPG",
  "/Assets/About/4.jpg",
  "/Assets/About/5.jpg",
  "/Assets/About/6.jpg",
];

const milestones = [
  { label: "Founded", value: "2018" },
  { label: "Members", value: "200+" },
  { label: "Events Hosted", value: "50+" },
  { label: "Editions of Overload++", value: "5+" },
];

const About = () => {
  return (
    <div className="bg-black min-h-screen">
      <Navigation />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#9113ff]/10 rounded-full blur-[150px] pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <p className="text-[#9113ff] font-['Oxanium'] tracking-[6px] uppercase text-sm mb-4 font-semibold">
            Who We Are
          </p>
          <h1 className="text-5xl md:text-7xl font-bold text-white font-['Anton'] uppercase tracking-wider">
            About <span className="text-[#9113ff]">Us</span>
          </h1>
          <p className="mt-6 text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed">
            A community of tech enthusiasts pushing the boundaries of innovation at Acharya Narendra Dev College.
          </p>
        </div>
      </section>

      {/* Image Mosaic + Story */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Mosaic Grid */}
          <div className="grid grid-cols-3 grid-rows-2 gap-3">
            {aboutImages.map((img, i) => (
              <div
                key={i}
                className={`overflow-hidden rounded-xl border border-white/5 group ${
                  i === 0 ? "col-span-2 row-span-1" : ""
                } ${i === 3 ? "col-span-2 row-span-1" : ""}`}
              >
                <img
                  src={img}
                  alt={`Turing Society moment ${i + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  style={{ minHeight: i === 0 || i === 3 ? "220px" : "180px" }}
                  loading="lazy"
                />
              </div>
            ))}
          </div>

          {/* Story */}
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white font-['Oxanium'] mb-2">
                The Turing Society
              </h2>
              <div className="w-16 h-1 bg-[#9113ff] rounded-full" />
            </div>

            <p className="text-gray-300 leading-relaxed text-base">
              The <span className="text-[#9113ff] font-semibold">Turing Society</span> is a dynamic departmental society
              fostering deep interest in computer science and technology. Rooted in Acharya Narendra Dev College under
              the University of Delhi, the society is named after the legendary computer scientist Alan Turing. Our
              mission is to promote learning, innovation, and collaboration among students passionate about technology.
            </p>

            <p className="text-gray-400 leading-relaxed text-base">
              We regularly organize seminars, workshops, and technical talks exploring cutting-edge topics — from
              artificial intelligence and machine learning to cybersecurity and data science. Our inclusive environment
              ensures every member has the opportunity to learn, grow, and contribute.
            </p>

            <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
              <p className="text-gray-300 leading-relaxed text-base">
                Our flagship event <span className="text-[#9113ff] font-semibold">OVERLOAD++</span> — the annual fest of
                the Computer Science Department — brings together enthusiasts for technical talks, intense coding
                challenges, thrilling gaming battles, and adventurous treasure hunts, offering a unique platform for
                skill-building and networking.
              </p>
            </div>

            <p className="text-gray-400 leading-relaxed text-base">
              Through competitions, hackathons, and collaborative projects, students develop problem-solving skills,
              creativity, and teamwork — making Turing Society a vibrant community for future tech leaders.
            </p>
          </div>
        </div>
      </section>

      {/* Milestones */}
      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto px-6 py-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {milestones.map((m) => (
            <div key={m.label}>
              <p className="text-4xl md:text-5xl font-bold text-[#9113ff] font-['Oxanium']">{m.value}</p>
              <p className="text-gray-400 text-sm mt-2 uppercase tracking-wider">{m.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <p className="text-[#9113ff] font-['Oxanium'] tracking-[4px] uppercase text-sm mb-3 font-semibold">
            Reach Out
          </p>
          <h2 className="text-3xl md:text-5xl font-bold text-white font-['Oxanium']">
            Get in Touch with the Future
          </h2>
          <p className="text-gray-400 mt-4 max-w-lg mx-auto">
            Have an idea, question, or just want to geek out? Drop us a message!
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          {[
            {
              icon: MapPin,
              title: "Address",
              lines: ["Acharya Narendra Dev College", "Govindpuri, Kalkaji", "New Delhi 110019"],
              href: "https://maps.google.com/?q=Acharya+Narendra+Dev+College",
            },
            {
              icon: Phone,
              title: "Phone",
              lines: ["+91 74283 85311"],
              href: "tel:+917428385311",
            },
            {
              icon: Mail,
              title: "Email",
              lines: ["turingandcs@gmail.com"],
              href: "mailto:turingandcs@gmail.com",
            },
          ].map((card) => (
            <a
              key={card.title}
              href={card.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-[#9113ff]/40 rounded-2xl p-8 text-center transition-all duration-300"
            >
              <div className="w-14 h-14 mx-auto mb-5 rounded-xl bg-[#9113ff]/10 flex items-center justify-center group-hover:bg-[#9113ff]/20 transition-colors">
                <card.icon className="text-[#9113ff]" size={24} />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2 font-['Oxanium']">{card.title}</h3>
              {card.lines.map((line, i) => (
                <p key={i} className="text-gray-400 text-sm">{line}</p>
              ))}
              <ExternalLink className="mx-auto mt-4 text-gray-600 group-hover:text-[#9113ff] transition-colors" size={16} />
            </a>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
