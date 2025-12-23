"use client";

import { motion } from "framer-motion";
import { Zap, Shield, Target, Eye, Globe, Lock, Database, BarChart3, Sparkles, TrendingUp, Clock } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Instant Sponsorship Checks",
    description: "Real-time UK visa sponsorship verification for any job. Know immediately if you're eligible before applying.",
    color: "from-blue-500 to-cyan-500",
    gradient: "from-blue-500/10 to-cyan-500/10",
    borderColor: "border-blue-500/20",
    hoverBorderColor: "hover:border-blue-500/40"
  },
  {
    icon: Shield,
    title: "ATS Optimization",
    description: "AI-powered resume analysis and optimization to pass through Applicant Tracking Systems with higher scores.",
    color: "from-green-500 to-emerald-500",
    gradient: "from-green-500/10 to-emerald-500/10",
    borderColor: "border-green-500/20",
    hoverBorderColor: "hover:border-green-500/40"
  },
  {
    icon: Target,
    title: "Smart Job Matching",
    description: "Advanced algorithms match your profile with the most suitable sponsored opportunities based on your skills and experience.",
    color: "from-purple-500 to-pink-500",
    gradient: "from-purple-500/10 to-pink-500/10",
    borderColor: "border-purple-500/20",
    hoverBorderColor: "hover:border-purple-500/40"
  },
  {
    icon: Eye,
    title: "Application Tracking",
    description: "Track all your applications in one place with status updates, follow-up reminders, and success analytics.",
    color: "from-orange-500 to-red-500",
    gradient: "from-orange-500/10 to-red-500/10",
    borderColor: "border-orange-500/20",
    hoverBorderColor: "hover:border-orange-500/40"
  },
  {
    icon: Globe,
    title: "Global Job Board Support",
    description: "Works with LinkedIn, Indeed, Glassdoor, and all major job boards. Highlight and analyze anywhere.",
    color: "from-indigo-500 to-blue-500",
    gradient: "from-indigo-500/10 to-blue-500/10",
    borderColor: "border-indigo-500/20",
    hoverBorderColor: "hover:border-indigo-500/40"
  },
  {
    icon: Lock,
    title: "Secure & Private",
    description: "Your data is encrypted and secure. We never share your information without your explicit consent.",
    color: "from-gray-500 to-slate-500",
    gradient: "from-gray-500/10 to-slate-500/10",
    borderColor: "border-gray-500/20",
    hoverBorderColor: "hover:border-gray-500/40"
  }
];

const stats = [
  {
    icon: Database,
    title: "50K+ Jobs Analyzed",
    description: "Extensive database of sponsored opportunities",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    iconBg: "bg-gradient-to-br from-blue-500 to-blue-600"
  },
  {
    icon: TrendingUp,
    title: "89% Success Rate",
    description: "Users report higher response rates",
    color: "text-green-600",
    bgColor: "bg-green-50",
    iconBg: "bg-gradient-to-br from-green-500 to-green-600"
  },
  {
    icon: Clock,
    title: "Instant Results",
    description: "Get analysis in seconds, not hours",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    iconBg: "bg-gradient-to-br from-purple-500 to-purple-600"
  }
];

export function FeaturesSection() {
  return (
    <section className="py-20 lg:py-32 bg-gradient-to-b from-muted/30 to-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Powerful Features</span>
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight"
          >
            Everything You Need to Land Your
            <span className="block text-primary"> Dream Job in the UK</span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-xl text-muted-foreground leading-relaxed"
          >
            Our comprehensive toolkit combines AI-powered insights with real-time data to give you a competitive edge in the UK job market.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
              className="group relative"
            >
              <div className={`h-full p-8 rounded-2xl bg-gradient-to-br ${feature.gradient} border ${feature.borderColor} ${feature.hoverBorderColor} backdrop-blur-sm motion-surface hover:shadow-xl hover:shadow-primary/10`}>
                {/* Animated Background Pattern */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 rounded-2xl motion-control`}></div>
                
                <div className="relative z-10">
                  <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${feature.color} text-white mb-6 shadow-lg group-hover:shadow-xl group-hover:scale-110 motion-control`}>
                    <feature.icon className="h-7 w-7" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-foreground mb-4 group-hover:text-primary motion-control">
                    {feature.title}
                  </h3>
                  
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Enhanced Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-8"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="group"
            >
              <div className={`text-center p-8 rounded-2xl ${stat.bgColor} border border-white/20 shadow-lg group-hover:shadow-xl motion-surface backdrop-blur-sm`}>
                <div className={`inline-flex p-4 rounded-2xl ${stat.iconBg} text-white mx-auto mb-6 shadow-lg group-hover:shadow-xl group-hover:scale-110 motion-control`}>
                  <stat.icon className="h-8 w-8" />
                </div>
                <h4 className={`font-bold text-xl text-foreground mb-3 group-hover:${stat.color} motion-control`}>
                  {stat.title}
                </h4>
                <p className="text-muted-foreground leading-relaxed">
                  {stat.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
