import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Linkedin, Instagram, Github, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  section: string;
  image_url: string | null;
  linkedin: string | null;
  instagram: string | null;
  github: string | null;
  sort_order: number;
  academic_year: string;
}

const SECTION_CONFIG = [
  { key: 'faculty', title: 'Faculty', highlight: 'Mentors', alt: false },
  { key: 'council', title: 'Student', highlight: 'Council', alt: true },
  { key: 'technical', title: 'Technical', highlight: 'Team', alt: false },
  { key: 'executive', title: 'Executive', highlight: 'Team', alt: true },
  { key: 'media', title: 'Media', highlight: 'Team', alt: false },
  { key: 'pr', title: 'PR', highlight: 'Team', alt: true },
];

const TeamCard = ({ member }: { member: TeamMember }) => (
  <div className="team-card-pro">
    <div className="team-card-image-wrapper">
      {member.image_url ? (
        <img src={member.image_url} alt={member.name} className="team-card-photo" />
      ) : (
        <div className="team-card-photo flex items-center justify-center bg-gray-800 text-gray-400 text-2xl font-bold">
          {member.name.charAt(0)}
        </div>
      )}
    </div>
    <h3 className="team-card-name-pro">{member.name}</h3>
    <p className="team-card-role-pro">{member.role}</p>
    {(member.linkedin || member.instagram || member.github) && (
      <div className="team-card-socials">
        {member.linkedin && (
          <a href={member.linkedin} target="_blank" rel="noreferrer" className="social-icon">
            <Linkedin size={18} />
          </a>
        )}
        {member.instagram && (
          <a href={member.instagram} target="_blank" rel="noreferrer" className="social-icon">
            <Instagram size={18} />
          </a>
        )}
        {member.github && (
          <a href={member.github} target="_blank" rel="noreferrer" className="social-icon">
            <Github size={18} />
          </a>
        )}
      </div>
    )}
  </div>
);

const TeamSection = ({ title, highlight, members, alt = false }: { title: string; highlight: string; members: TeamMember[]; alt?: boolean }) => {
  if (members.length === 0) return null;
  return (
    <section className={`team-section-pro ${alt ? "team-section-alt" : ""}`}>
      <div className="section-header-pro">
        <h2>
          {title} <span className="text-gradient">{highlight}</span>
        </h2>
      </div>
      <div className="team-grid-pro">
        {members.map((m) => (
          <TeamCard key={m.id} member={m} />
        ))}
      </div>
      <div className="section-divider" />
    </section>
  );
};

const Teams = () => {
  const [membersBySection, setMembersBySection] = useState<Record<string, TeamMember[]>>({});
  const [loading, setLoading] = useState(true);
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [heroImage, setHeroImage] = useState<string>("/Assets/GroupCore.webp");
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);

  // Fetch available years and hero image on mount
  useEffect(() => {
    const init = async () => {
      const [yearsRes, heroRes] = await Promise.all([
        supabase
          .from('public_team_members')
          .select('academic_year')
          .eq('is_visible', true),
        supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'teams_hero_image')
          .maybeSingle(),
      ]);

      if (yearsRes.data) {
        const unique = [...new Set(yearsRes.data.map(r => r.academic_year))].sort().reverse();
        setAvailableYears(unique);
        if (unique.length > 0) setSelectedYear(unique[0]);
      }

      if (heroRes.data?.value) {
        setHeroImage(heroRes.data.value);
      }
    };
    init();
  }, []);

  // Fetch members when year changes
  useEffect(() => {
    if (!selectedYear) return;
    const fetchMembers = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('public_team_members')
        .select('*')
        .eq('is_visible', true)
        .eq('academic_year', selectedYear)
        .order('sort_order');

      if (!error && data) {
        const grouped: Record<string, TeamMember[]> = {};
        data.forEach(member => {
          if (!grouped[member.section]) grouped[member.section] = [];
          grouped[member.section].push(member);
        });
        setMembersBySection(grouped);
      }
      setLoading(false);
    };
    fetchMembers();
  }, [selectedYear]);

  return (
    <div className="teams-page">
      <Navigation />

      {/* Hero Section */}
      <section
        className="teams-hero"
        style={{ backgroundImage: `url("${heroImage}")` }}
      >
        <div className="teams-hero-overlay" />
        <div className="teams-hero-content">
          <h1>
            Meet Our <span className="text-gradient">Team</span>
          </h1>
          <p>The passionate minds driving innovation at Turing Society ANDC</p>
        </div>
      </section>

      {/* Year Selector */}
      {availableYears.length > 1 && (
        <div className="flex justify-center py-6">
          <div className="relative">
            <button
              onClick={() => setYearDropdownOpen(!yearDropdownOpen)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-700 bg-black/50 text-white text-sm font-medium hover:border-gray-500 transition-colors backdrop-blur-sm"
            >
              <span className="text-gray-400 text-xs">Session:</span>
              <span>{selectedYear}</span>
              <ChevronDown size={14} className={`text-gray-400 transition-transform ${yearDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {yearDropdownOpen && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-[#111] border border-gray-700 rounded-xl overflow-hidden shadow-xl z-20">
                {availableYears.map(year => (
                  <button
                    key={year}
                    onClick={() => { setSelectedYear(year); setYearDropdownOpen(false); }}
                    className={`w-full px-4 py-2.5 text-sm text-left transition-colors ${
                      year === selectedYear ? 'bg-[#9113ff]/20 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Team Sections */}
      <div className="teams-container">
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading team...</div>
        ) : (
          SECTION_CONFIG.map(s => (
            <TeamSection
              key={s.key}
              title={s.title}
              highlight={s.highlight}
              members={membersBySection[s.key] || []}
              alt={s.alt}
            />
          ))
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Teams;
