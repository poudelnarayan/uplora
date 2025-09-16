import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function GET(req: NextRequest) {
  try {
    // Fetch all prices from Stripe
    const prices = await stripe.prices.list({
      active: true,
      expand: ['data.product'],
    });

    // Format prices for frontend consumption
    const formattedPrices = prices.data.map(price => ({
      id: price.id,
      productId: price.product,
      unitAmount: price.unit_amount,
      currency: price.currency,
      interval: price.recurring?.interval,
      intervalCount: price.recurring?.interval_count,
      type: price.type,
      active: price.active,
      nickname: price.nickname,
      product: {
        id: (price.product as any)?.id,
        name: (price.product as any)?.name,
        description: (price.product as any)?.description,
      },
    }));

    return NextResponse.json({ prices: formattedPrices });

  } catch (error) {
    console.error('Fetch prices error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prices' },
      { status: 500 }
    );
  }
}