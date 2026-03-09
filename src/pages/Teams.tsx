import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Linkedin, Instagram, Github } from "lucide-react";

interface TeamMember {
  name: string;
  role: string;
  image: string;
  linkedin?: string;
  instagram?: string;
  github?: string;
}

const faculty: TeamMember[] = [
  { name: "Prof. Vibha Gaur", role: "Convenor", image: "/Assets/VibhaMaam.png" },
  { name: "Prof. ChandraKant Samal", role: "Teacher-in-Charge", image: "/Assets/CKSir.png" },
  { name: "Ms. Nishu Singh", role: "Co-convenor", image: "/Assets/NishuMaam.jpg" },
];

const council: TeamMember[] = [
  { name: "Yash Asthana", role: "President", image: "/Assets/Coreteam/Yash.jpg", linkedin: "https://www.linkedin.com/in/yashaksthana158", instagram: "https://www.instagram.com/yashaksthana158", github: "https://github.com/yashaksthana158" },
  { name: "Kush Gautam", role: "Vice-President", image: "/Assets/Coreteam/Kush.jpg", linkedin: "https://www.linkedin.com/in/yashaksthana158", instagram: "https://www.instagram.com/yashaksthana158", github: "https://github.com/yashaksthana158" },
  { name: "Sapna Yadav", role: "Secretary", image: "/Assets/Coreteam/Sapna.jpg", linkedin: "https://www.linkedin.com/in/yashaksthana158", instagram: "https://www.instagram.com/yashaksthana158", github: "https://github.com/yashaksthana158" },
  { name: "Ishitva Joshi", role: "Treasurer", image: "/Assets/Coreteam/Ishitva.jpg" , linkedin: "https://www.linkedin.com/in/yashaksthana158", instagram: "https://www.instagram.com/yashaksthana158", github: "https://github.com/yashaksthana158"},
  { name: "Anshuman Thakur", role: "Technical Head", image: "/Assets/Coreteam/Anshuman.jpg", linkedin: "https://www.linkedin.com/in/yashaksthana158", instagram: "https://www.instagram.com/yashaksthana158", github: "https://github.com/yashaksthana158" },
  { name: "Subham Kumar", role: "Executive Head", image: "/Assets/Coreteam/Shubham.jpg", linkedin: "https://www.linkedin.com/in/yashaksthana158", instagram: "https://www.instagram.com/yashaksthana158", github: "https://github.com/yashaksthana158" },
  { name: "Rishik Chaudhary", role: "Executive Head", image: "/Assets/Coreteam/Rishik.jpg" },
  { name: "Aditya Maurya", role: "Media Chief", image: "/Assets/Coreteam/Aditya%20maurya.jpeg" },
];

const technicalTeam: TeamMember[] = [
  { name: "Nitesh Verma", role: "Technical Member", image: "/Assets/teams/technical/Nitesh.JPG" },
  { name: "Jayesh Raj Neti", role: "Technical Member", image: "/Assets/teams/technical/Jayesh.JPG" },
  { name: "MO. Saif", role: "Technical Member", image: "/Assets/teams/technical/Saif.JPG" },
  { name: "Aditya Gupta", role: "Technical Member", image: "/Assets/teams/technical/Aditya_Gupta.jpg" },
  { name: "Himanshu Yadav", role: "Technical Member", image: "/Assets/teams/technical/himanshu.JPG" },
  { name: "Vishal", role: "Technical Member", image: "/Assets/teams/technical/vishal.jpg" },
];

const executiveTeam: TeamMember[] = [
  { name: "Awani Yadav", role: "Executive Member", image: "/Assets/teams/executive/Awani.JPG" },
  { name: "Kriti Misra", role: "Executive Member", image: "/Assets/teams/executive/Kriti_Misra.JPG" },
  { name: "Sakshi Verma", role: "Executive Member", image: "/Assets/teams/executive/Sakshi_Verma.JPG" },
  { name: "MD. Nouman Noorain", role: "Executive Member", image: "/Assets/teams/executive/Nouman.jpg" },
  { name: "Dhruv", role: "Executive Member", image: "/Assets/teams/executive/Dhruv.jpg" },
  { name: "Dhiraj", role: "Executive Member", image: "/Assets/teams/executive/Dhiraj.jpg" },
  { name: "Gunjan Arora", role: "Executive Member", image: "/Assets/teams/executive/Gunjan%20Arora.jpeg" },
  { name: "Riya", role: "Executive Member", image: "/Assets/teams/executive/Riya.JPG" },
  { name: "Rupali", role: "Executive Member", image: "/Assets/teams/executive/Rupali.JPG" },
  { name: "Sangeeta", role: "Executive Member", image: "/Assets/teams/executive/Sangeeta.JPG" },
  { name: "Shivansh", role: "Executive Member", image: "/Assets/teams/executive/Shivansh.jpg" },
];

const mediaTeam: TeamMember[] = [
  { name: "Akshat", role: "Media Member", image: "/Assets/teams/media/Akshat.JPG" },
  { name: "Anamika", role: "Media Member", image: "/Assets/teams/media/Anamika.JPG" },
  { name: "Dhananjay", role: "Media Member", image: "/Assets/teams/media/Dhananjay.JPG" },
  { name: "Divyanshu", role: "Media Member", image: "/Assets/teams/media/Divyanshu.JPG" },
  { name: "Harsh Singh Sen", role: "Media Member", image: "/Assets/teams/media/Harsh_singh_sen.JPG" },
  { name: "Tanisha", role: "Media Member", image: "/Assets/teams/media/Tanisha.JPG" },
  { name: "Sharvan", role: "Media Member", image: "/Assets/teams/media/sharvan.jpg" },
];

const prTeam: TeamMember[] = [
  { name: "Abhijit", role: "PR Member", image: "/Assets/teams/pr/Abhijit.jpg" },
  { name: "Akansha", role: "PR Member", image: "/Assets/teams/pr/Akansha.jpg" },
  { name: "Rose Sablania", role: "PR Member", image: "/Assets/teams/pr/Rose_Sablania.JPG" },
  { name: "Shubham Kumar Shukla", role: "PR Member", image: "/Assets/teams/pr/Shubham_kumar_shukla.JPG" },
  { name: "Vrinda Gupta", role: "PR Member", image: "/Assets/teams/pr/Vrinda_gupta.jpg" },
  { name: "Shanu", role: "PR Member", image: "/Assets/teams/pr/shanu.JPG" },
];

const TeamCard = ({ member }: { member: TeamMember }) => (
  <div className="team-card-pro">
    <div className="team-card-image-wrapper">
      <img src={member.image} alt={member.name} className="team-card-photo" />
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

const TeamSection = ({ title, highlight, members, alt = false }: { title: string; highlight: string; members: TeamMember[]; alt?: boolean }) => (
  <section className={`team-section-pro ${alt ? "team-section-alt" : ""}`}>
    <div className="section-header-pro">
      <h2>
        {title} <span className="text-gradient">{highlight}</span>
      </h2>
    </div>
    <div className="team-grid-pro">
      {members.map((m, i) => (
        <TeamCard key={i} member={m} />
      ))}
    </div>
    <div className="section-divider" />
  </section>
);

const Teams = () => {
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
        <TeamSection title="Faculty" highlight="Mentors" members={faculty} />
        <TeamSection title="Student" highlight="Council" members={council} alt />
        <TeamSection title="Technical" highlight="Team" members={technicalTeam} />
        <TeamSection title="Executive" highlight="Team" members={executiveTeam} alt />
        <TeamSection title="Media" highlight="Team" members={mediaTeam} />
        <TeamSection title="PR" highlight="Team" members={prTeam} alt />
      </div>

      <Footer />
    </div>
  );
};

export default Teams;
