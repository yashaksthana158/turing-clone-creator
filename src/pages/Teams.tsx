import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

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

// Use URL encoding for space in folder name: "Core team" -> "Core%20team"
const council: TeamMember[] = [
  { name: "Yash Asthana", role: "President", image: "/Assets/Core%20team/Yash.jpg", linkedin: "https://www.linkedin.com/in/yashaksthana158", instagram: "https://www.instagram.com/yashaksthana158", github: "https://github.com/yashaksthana158" },
  { name: "Kush Gautam", role: "Vice-President", image: "/Assets/Core%20team/Kush.jpg" },
  { name: "Sapna Yadav", role: "Secretary", image: "/Assets/Core%20team/Sapna.jpg" },
  { name: "Ishitva Joshi", role: "Treasurer", image: "/Assets/Core%20team/Ishitva.jpg" },
  { name: "Anshuman Thakur", role: "Technical Head", image: "/Assets/Core%20team/Anshuman.jpg" },
  { name: "Subham Kumar", role: "Executive Head", image: "/Assets/Core%20team/Shubham.jpg" },
  { name: "Rishik Chaudhary", role: "Executive Head", image: "/Assets/Core%20team/Rishik.jpg" },
  { name: "Aditya Maurya", role: "Media Chief", image: "/Assets/Core%20team/Aditya%20maurya.jpeg" },
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
  <div className="team-card">
    <div className="team-card-bar" />
    <img
      src={member.image}
      alt={member.name}
      className="team-card-img"
    />
    <h3 className="team-card-name">{member.name}</h3>
    <p className="team-card-role">{member.role}</p>
    {(member.linkedin || member.instagram || member.github) && (
      <div className="team-card-links">
        {member.linkedin && <a href={member.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>}
        {member.instagram && <a href={member.instagram} target="_blank" rel="noreferrer">Instagram</a>}
        {member.github && <a href={member.github} target="_blank" rel="noreferrer">GitHub</a>}
      </div>
    )}
  </div>
);

const TeamSection = ({ title, highlight, members }: { title: string; highlight: string; members: TeamMember[] }) => (
  <section className="team-section">
    <h2 className="team-section-title">
      {title} <span style={{ color: "#9113ff" }}>{highlight}</span>
    </h2>
    <div className="team-grid">
      {members.map((m, i) => (
        <TeamCard key={i} member={m} />
      ))}
    </div>
  </section>
);

const Teams = () => {
  return (
    <div>
      <Navigation />
      <div style={{ paddingTop: "100px", backgroundColor: "#000", minHeight: "100vh" }}>
        <TeamSection title="Faculty" highlight="Mentors" members={faculty} />
        <TeamSection title="Student" highlight="Council" members={council} />
        <TeamSection title="Technical" highlight="Team" members={technicalTeam} />
        <TeamSection title="Executive" highlight="Team" members={executiveTeam} />
        <TeamSection title="Media" highlight="Team" members={mediaTeam} />
        <TeamSection title="PR" highlight="Team" members={prTeam} />
      </div>
      <Footer />
    </div>
  );
};

export default Teams;
