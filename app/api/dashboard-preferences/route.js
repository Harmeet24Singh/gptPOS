import { NextResponse } from 'next/server';
const mongo = require('../../../server/mongo');

export async function GET() {
  try {
    const db = await mongo.connectToDatabase();
    
    const preferences = await db.collection('dashboard-preferences').findOne({ 
      userId: 'default' // For now, using default user. Can be extended for multi-user
    });
    
    return NextResponse.json(preferences || {
      userId: 'default',
      visibleSections: {
        totalSales: true,
        totalTransactions: true,
        averageSale: true,
        peakHour: true,
        cashEarnings: true,
        cardEarnings: true,
        paymentRatio: true,
        topProducts: true
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard preferences:', error);
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const db = await mongo.connectToDatabase();
    
    const { visibleSections } = await request.json();
    
    const result = await db.collection('dashboard-preferences').updateOne(
      { userId: 'default' },
      { 
        $set: { 
          userId: 'default',
          visibleSections,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
    
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Error saving dashboard preferences:', error);
    return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 });
  }
}