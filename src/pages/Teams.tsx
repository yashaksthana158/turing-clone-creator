import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Linkedin, Instagram, Github } from "lucide-react";
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

  useEffect(() => {
    const fetchMembers = async () => {
      const { data, error } = await supabase
        .from('public_team_members')
        .select('*')
        .eq('is_visible', true)
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
  }, []);

  return (
    <div className="teams-page">
      <Navigation />

      {/* Hero Section */}
      <section className="teams-hero">
        <div className="teams-hero-overlay" />
        <div className="teams-hero-content">
          <h1>
            Meet Our <span className="text-gradient">Team</span>
          </h1>
          <p>The passionate minds driving innovation at Turing Society ANDC</p>
        </div>
      </section>

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
