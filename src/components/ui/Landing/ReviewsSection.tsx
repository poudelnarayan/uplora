import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";

const reviews = [
  {
    name: "Sarah Chen",
    role: "Content Creator",
    handle: "@sarahcreates",
    platform: "TikTok",
    rating: 5,
    review: "Honestly, this changed everything for my team. We used to waste HOURS posting the same video to 6 platforms. Now I just upload once and boom - it's everywhere. My editor drafts stuff while I'm sleeping and I approve it in the morning. So much better than doing everything manually!",
    avatar: "S",
    bgColor: "bg-primary"
  },
  {
    name: "Marcus Rodriguez",
    role: "YouTuber",
    handle: "@MarcusDaily",
    platform: "YouTube",
    rating: 5,
    review: "Bro, finally found something that actually works for teams! My editor uploads our videos, I check them real quick, and they go live everywhere automatically. No more forgetting to post on Instagram or LinkedIn. My workflow is actually smooth now instead of chaotic mess lol",
    avatar: "M",
    bgColor: "bg-accent"
  },
  {
    name: "Jessica Park",
    role: "Lifestyle Influencer",
    handle: "@jessliving",
    platform: "Instagram",
    rating: 5,
    review: "Ok this is actually insane how much time it saves. I have 3 people helping with content and before it was so confusing who was posting what. Now everyone knows their role - they create, I approve, it publishes. Simple. Wish I found this years ago tbh.",
    avatar: "J",
    bgColor: "bg-purple-500"
  },
  {
    name: "David Kim",
    role: "Tech Reviewer",
    handle: "@TechWithDave",
    platform: "YouTube",
    rating: 5,
    review: "Tried literally every scheduling tool out there and none handled approvals properly. This one actually gets it. My team can draft reviews, I check them before they go live, and everything posts on time across all platforms. Finally something that works how teams actually work.",
    avatar: "D",
    bgColor: "bg-green-500"
  },
  {
    name: "Amanda Foster",
    role: "Food Content Creator",
    handle: "@cookingwithmandy",
    platform: "TikTok",
    rating: 5,
    review: "The approval thing is chef's kiss perfect. My assistant preps all the recipe posts during the day, I review them at night, and they go out next morning. No more staying up late to post or forgetting platforms. Plus it handles my big cooking videos without issues.",
    avatar: "A",
    bgColor: "bg-orange-500"
  },
  {
    name: "Ryan Thompson",
    role: "Fitness Influencer",
    handle: "@RyanFitLife",
    platform: "Instagram",
    rating: 5,
    review: "Game changer for sure. My content team is in different time zones and this keeps us all synced. They create workout posts, I approve them before my morning coffee, and everything goes live perfectly. Went from content chaos to actually having a system that works.",
    avatar: "R",
    bgColor: "bg-blue-500"
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
          {reviews.map((review, index) => (
            <Card key={index} className="shadow-medium hover-lift bg-card relative overflow-hidden">
              {/* Quote Icon */}
              <div className="absolute top-4 right-4 opacity-10">
                <Quote className="h-8 w-8 text-primary" />
              </div>
              
              <CardContent className="p-6">
                {/* Rating */}
                <div className="flex items-center space-x-1 mb-4">
                  {[1,2,3,4,5].map((star) => (
                    <Star 
                      key={star} 
                      className={`h-4 w-4 ${
                        star <= review.rating 
                          ? 'fill-yellow-400 text-yellow-400' 
                          : 'text-gray-300'
                      }`} 
                    />
                  ))}
                </div>

                {/* Review Text */}
                <p className="text-muted-foreground leading-relaxed mb-6">
                  "{review.review}"
                </p>

                {/* Reviewer Info */}
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 ${review.bgColor} rounded-full flex items-center justify-center text-white font-bold text-lg`}>
                    {review.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{review.name}</div>
                    <div className="text-sm text-muted-foreground">{review.role}</div>
                    <div className="text-xs text-accent font-medium">{review.handle} • {review.platform}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 text-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div>
              <div className="text-3xl font-bold text-primary mb-2">100+</div>
              <div className="text-muted-foreground">Happy Teams</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-accent mb-2">75K+</div>
              <div className="text-muted-foreground">Posts Published</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-500 mb-2">99.9%</div>
              <div className="text-muted-foreground">Uptime</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-500 mb-2">24/7</div>
              <div className="text-muted-foreground">Support</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ReviewsSection;