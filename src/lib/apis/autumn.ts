import { Autumn } from 'autumn-js';

const autumn = new Autumn({
  apiKey: process.env.AUTUMN_API_KEY!,
  environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
});

// Constants for our platform
const DEGEN_PRODUCT_ID = 'degen';
const PLATFORM_FEE_PERCENTAGE = 0.80; // 80% platform cut
const DEFAULT_USER_EMAIL = 'user@agentic-gambling.com'; // Single user for hackathon

export interface CreateCustomerData {
  email: string;
  name?: string;
  metadata?: Record<string, any>;
}

export interface ProfitShareCharge {
  userId: string;
  profitAmount: number; // total profit in dollars
  category: 'trading' | 'poker' | 'polymarket';
  description?: string;
}

export const autumnApi = {
  // Initialize user: create customer and subscribe to degen plan
  async initializeUser(userId: string = 'user') {
    try {
      // Create customer
      const customer = await autumn.customers.create({
        email: DEFAULT_USER_EMAIL,
        name: 'Degen Trader',
        metadata: { userId, platform: 'agentic-gambling' }
      });

      // Subscribe to degen plan (you'll need the actual price ID from your Autumn dashboard)
      // For now, we'll just create the customer - subscription happens when they get the "profit" feature
      const subscription = null; // We'll handle this when you create the actual price in Autumn

      return { customer, subscription };
    } catch (error) {
      console.error('Failed to initialize user:', error);
      throw error;
    }
  },

  // Get customer by userId (metadata lookup)
  async getCustomerByUserId(userId: string = 'user') {
    try {
      const customers = await autumn.customers.list({
        metadata: { userId }
      });
      return customers.data[0] || null;
    } catch (error) {
      console.error('Failed to get customer:', error);
      return null;
    }
  },

  // Charge user for profit sharing (80% of profits)
  async chargeProfitShare(data: ProfitShareCharge) {
    try {
      const customer = await this.getCustomerByUserId(data.userId);
      if (!customer) {
        throw new Error('Customer not found');
      }

      const platformFee = Math.floor(data.profitAmount * PLATFORM_FEE_PERCENTAGE * 100); // Convert to cents
      
      if (platformFee <= 0) {
        return null; // No charge for losses or break-even
      }

      const charge = await autumn.charges.create({
        customer: customer.id,
        amount: platformFee, // in cents
        currency: 'usd',
        description: data.description || `Platform fee (80%) for ${data.category} profits: $${data.profitAmount.toFixed(2)}`,
        metadata: {
          userId: data.userId,
          category: data.category,
          originalProfit: data.profitAmount,
          platformFeePercent: PLATFORM_FEE_PERCENTAGE
        }
      });

      return charge;
    } catch (error) {
      console.error('Failed to charge profit share:', error);
      throw error;
    }
  },

  // Get all charges for a user
  async getUserCharges(userId: string = 'user') {
    try {
      const customer = await this.getCustomerByUserId(userId);
      if (!customer) return [];

      const charges = await autumn.charges.list({ customer: customer.id });
      return charges.data;
    } catch (error) {
      console.error('Failed to get user charges:', error);
      return [];
    }
  },

  // Get user subscription status
  async getUserSubscription(userId: string = 'user') {
    try {
      const customer = await this.getCustomerByUserId(userId);
      if (!customer) return null;

      const subscriptions = await autumn.subscriptions.list({ customer: customer.id });
      return subscriptions.data[0] || null;
    } catch (error) {
      console.error('Failed to get user subscription:', error);
      return null;
    }
  },

  // Calculate platform fee (80% of profits)
  calculatePlatformFee(profitAmount: number): number {
    return Math.floor(profitAmount * PLATFORM_FEE_PERCENTAGE * 100) / 100; // Round to cents
  },

  // Calculate user's share (20% of profits)
  calculateUserShare(profitAmount: number): number {
    return Math.floor(profitAmount * (1 - PLATFORM_FEE_PERCENTAGE) * 100) / 100; // Round to cents
  },
};

export default autumnApi;
