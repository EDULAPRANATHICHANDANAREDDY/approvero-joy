import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Holiday {
  date: string;
  name: string;
  wish: string;
}

// Define holidays with festive messages
const HOLIDAYS_2026: Holiday[] = [
  { date: "2026-01-01", name: "New Year's Day", wish: "🎉 Happy New Year! Wishing you a prosperous and joyful 2026 filled with success and happiness!" },
  { date: "2026-01-14", name: "Makar Sankranti", wish: "🪁 Happy Makar Sankranti! May this harvest festival bring sweetness and joy to your life!" },
  { date: "2026-01-26", name: "Republic Day", wish: "🇮🇳 Happy Republic Day! Celebrating the spirit of democracy and unity!" },
  { date: "2026-02-14", name: "Valentine's Day", wish: "💕 Happy Valentine's Day! Spread love and kindness today!" },
  { date: "2026-03-10", name: "Holi", wish: "🌈 Happy Holi! May your life be filled with vibrant colors of joy and happiness!" },
  { date: "2026-03-30", name: "Ugadi / Gudi Padwa", wish: "🌺 Happy Ugadi! May this new year bring prosperity and new beginnings!" },
  { date: "2026-04-02", name: "Ram Navami", wish: "🙏 Happy Ram Navami! May Lord Rama bless you with wisdom and strength!" },
  { date: "2026-04-03", name: "Good Friday", wish: "✝️ Blessed Good Friday! A day of reflection and hope." },
  { date: "2026-04-05", name: "Easter", wish: "🐣 Happy Easter! May this day bring renewal and joy to your heart!" },
  { date: "2026-05-01", name: "May Day", wish: "💪 Happy May Day! Celebrating the spirit of workers worldwide!" },
  { date: "2026-05-23", name: "Buddha Purnima", wish: "☸️ Happy Buddha Purnima! May peace and enlightenment guide your path!" },
  { date: "2026-06-21", name: "International Yoga Day", wish: "🧘 Happy International Yoga Day! Take a moment to breathe and find your inner peace!" },
  { date: "2026-07-07", name: "Eid al-Adha", wish: "🌙 Eid Mubarak! May this blessed day bring joy and peace to you and your family!" },
  { date: "2026-08-15", name: "Independence Day", wish: "🇮🇳 Happy Independence Day! Celebrating the spirit of freedom and unity!" },
  { date: "2026-08-19", name: "Raksha Bandhan", wish: "🎀 Happy Raksha Bandhan! Celebrating the beautiful bond of siblings!" },
  { date: "2026-08-27", name: "Janmashtami", wish: "🪈 Happy Janmashtami! May Lord Krishna fill your life with love and happiness!" },
  { date: "2026-09-07", name: "Onam", wish: "🌸 Happy Onam! May King Mahabali's blessings bring prosperity to your home!" },
  { date: "2026-10-02", name: "Gandhi Jayanti", wish: "🕊️ Remembering Mahatma Gandhi on his birth anniversary. Be the change you wish to see!" },
  { date: "2026-10-03", name: "Dussehra", wish: "🏹 Happy Dussehra! May good always triumph over evil in your life!" },
  { date: "2026-10-23", name: "Diwali", wish: "🪔 Happy Diwali! May the festival of lights bring prosperity and happiness to your life!" },
  { date: "2026-11-01", name: "Kannada Rajyotsava", wish: "🎊 Happy Kannada Rajyotsava! Celebrating Karnataka's rich culture and heritage!" },
  { date: "2026-11-14", name: "Children's Day", wish: "🧒 Happy Children's Day! Celebrating the joy and innocence of childhood!" },
  { date: "2026-11-26", name: "Thanksgiving", wish: "🦃 Happy Thanksgiving! A day to count your blessings and be grateful!" },
  { date: "2026-12-25", name: "Christmas", wish: "🎄 Merry Christmas! May the spirit of joy and love fill your heart!" },
  { date: "2026-12-31", name: "New Year's Eve", wish: "🥂 Happy New Year's Eve! Cheers to new beginnings and wonderful memories ahead!" },
];

export function useHolidayNotifications() {
  useEffect(() => {
    const checkAndCreateHolidayNotification = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split("T")[0];
      const holiday = HOLIDAYS_2026.find(h => h.date === today);
      
      if (holiday) {
        // Check if notification already exists for today's holiday
        const { data: existing } = await supabase
          .from("notifications")
          .select("id")
          .eq("user_id", user.id)
          .eq("type", "holiday")
          .eq("title", holiday.name)
          .gte("created_at", today)
          .maybeSingle();

        if (!existing) {
          await supabase.from("notifications").insert({
            user_id: user.id,
            title: `🎊 ${holiday.name}`,
            message: holiday.wish,
            type: "holiday",
          });
        }
      }
    };

    checkAndCreateHolidayNotification();
  }, []);
}
