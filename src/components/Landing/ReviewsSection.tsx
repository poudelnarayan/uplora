import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote, Youtube, Instagram, Play, Camera } from "lucide-react";

// Platform icon mapping
const platformIcons = {
  YouTube: Youtube,
  Instagram: Instagram,
  TikTok: Play,
  Twitter: Camera
};

// Platform colors mapping
const platformColors = {
  YouTube: "bg-red-500",
  Instagram: "bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-400",
  TikTok: "bg-black",
  Twitter: "bg-blue-400"
};

const reviews = [
  {
    name: "Sarah Chen",
    role: "Content Creator",
    handle: "@sarahcreates",
    platform: "TikTok",
    rating: 5,
    review: "Honestly, this changed everything for my team. We used to waste HOURS posting the same video to 6 platforms. Now I just upload once and boom - it's everywhere. My editor drafts stuff while I'm sleeping and I approve it in the morning. So much better than doing everything manually!",
    avatar: "S",
    bgColor: "bg-primary",
    followers: "2.4M"
  },
  {
    name: "Marcus Rodriguez",
    role: "YouTuber",
    handle: "@MarcusDaily",
    platform: "YouTube",
    rating: 5,
    review: "Bro, finally found something that actually works for teams! My editor uploads our videos, I check them real quick, and they go live everywhere automatically. No more forgetting to post on Instagram or LinkedIn. My workflow is actually smooth now instead of chaotic mess lol",
    avatar: "M",
    bgColor: "bg-accent",
    followers: "850K"
  },
  {
    name: "Jessica Park",
    role: "Lifestyle Influencer",
    handle: "@jessliving",
    platform: "Instagram",
    rating: 5,
    review: "Ok this is actually insane how much time it saves. I have 3 people helping with content and before it was so confusing who was posting what. Now everyone knows their role - they create, I approve, it publishes. Simple. Wish I found this years ago tbh.",
    avatar: "J",
    bgColor: "bg-purple-500",
    followers: "1.2M"
  },
  {
    name: "David Kim",
    role: "Tech Reviewer",
    handle: "@TechWithDave",
    platform: "YouTube",
    rating: 5,
    review: "Tried literally every scheduling tool out there and none handled approvals properly. This one actually gets it. My team can draft reviews, I check them before they go live, and everything posts on time across all platforms. Finally something that works how teams actually work.",
    avatar: "D",
    bgColor: "bg-green-500",
    followers: "500K"
  },
  {
    name: "Amanda Foster",
    role: "Food Content Creator",
    handle: "@cookingwithmandy",
    platform: "TikTok",
    rating: 5,
    review: "The approval thing is chef's kiss perfect. My assistant preps all the recipe posts during the day, I review them at night, and they go out next morning. No more staying up late to post or forgetting platforms. Plus it handles my big cooking videos without issues.",
    avatar: "A",
    bgColor: "bg-orange-500",
    followers: "3.1M"
  },
  {
    name: "Ryan Thompson",
    role: "Fitness Influencer",
    handle: "@RyanFitLife",
    platform: "Instagram",
    rating: 5,
    review: "Game changer for sure. My content team is in different time zones and this keeps us all synced. They create workout posts, I approve them before my morning coffee, and everything goes live perfectly. Went from content chaos to actually having a system that works.",
    avatar: "R",
    bgColor: "bg-blue-500",
    followers: "890K"
  }
];

const ReviewsSection = () => {
  return (
    <section id="reviews" className="py-20 bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Loved by <span className="gradient-text">Teams Worldwide</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            See why thousands of content teams trust Uplora for their collaborative workflow
          </p>
          
          {/* Overall Rating */}
          <div className="flex items-center justify-center mt-8 space-x-2">
            <div className="flex items-center space-x-1">
              {[1,2,3,4,5].map((star) => (
                <Star key={star} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <span className="text-lg font-semibold">4.9/5</span>
            <span className="text-muted-foreground">from 100+ reviews</span>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reviews.map((review, index) => {
            const PlatformIcon = platformIcons[review.platform as keyof typeof platformIcons];
            const platformColor = platformColors[review.platform as keyof typeof platformColors];
            
            return (
              <Card key={index} className="shadow-medium hover-lift bg-card relative overflow-hidden border border-border/50 hover:border-primary/20 transition-all group">
                {/* Platform Badge */}
                <div className="absolute top-4 right-4">
                  <div className={`w-8 h-8 ${platformColor} rounded-lg flex items-center justify-center shadow-soft`}>
                    <PlatformIcon className="w-4 h-4 text-white" />
                  </div>
                </div>
                
                {/* Quote Icon */}
                <div className="absolute top-16 right-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Quote className="h-12 w-12 text-primary" />
                </div>
                
                <CardContent className="p-6">
                  {/* Platform & Followers */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className={`w-6 h-6 ${platformColor} rounded flex items-center justify-center`}>
                        <PlatformIcon className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">{review.platform}</span>
                    </div>
                    <div className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                      {review.followers} followers
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center space-x-1 mb-4">
                    {[1,2,3,4,5].map((star) => (
                      <Star 
                        key={star} 
                        className={`h-4 w-4 transition-colors ${
                          star <= review.rating 
                            ? 'fill-amber-400 text-amber-400' 
                            : 'fill-muted/30 text-muted/30'
                        }`} 
                      />
                    ))}
                    <span className="text-sm text-muted-foreground ml-2">({review.rating}.0)</span>
                  </div>

                  {/* Review Text */}
                  <p className="text-muted-foreground leading-relaxed mb-6 text-sm">
                    "{review.review}"
                  </p>

                  {/* Reviewer Info */}
                  <div className="flex items-center space-x-3 pt-4 border-t border-border/30">
                    <div className={`w-12 h-12 ${review.bgColor} rounded-full flex items-center justify-center text-white font-bold text-lg shadow-soft`}>
                      {review.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-foreground text-sm">{review.name}</div>
                      <div className="text-xs text-muted-foreground">{review.role}</div>
                      <div className="text-xs font-medium" style={{color: review.platform === 'YouTube' ? '#ff0000' : review.platform === 'Instagram' ? '#e4405f' : review.platform === 'TikTok' ? '#000000' : '#1da1f2'}}>
                        {review.handle}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Verified
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

       
      </div>
    </section>
  );
};

export default ReviewsSection;