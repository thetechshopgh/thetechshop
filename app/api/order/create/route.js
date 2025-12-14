import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase'; // Assuming Admin/Service Role Key

export async function POST(req) {
    try {
        const body = await req.json();
        
        // 1. Destructure the full payload from the client
        const { email, amount, metadata } = body;
        const totalAmount = parseFloat(amount); // Ensure it's a number
        
        // 2. Prepare data for initial (PENDING) insertion
        const orderData = {
            customer_email: email,
            amount: totalAmount,
            reference: 'PENDING', // Temporary reference
            status: 'pending', // Initial status is PENDING
            full_name: metadata.fullName,
            phone_number: metadata.phoneNumber,
            digital_address: metadata.digitalAddress,
            delivery_address: metadata.deliveryAddress,
            order_items_json: JSON.parse(JSON.stringify(metadata.cartItems)),
        };

        // 3. Insert into Supabase
        const { data, error } = await supabase
            .from('orders')
            .insert([orderData])
            .select('order_uuid') // Get the unique ID back
            .single();

        if (error) {
            console.error("Supabase Order Creation Error:", error);
            return NextResponse.json({ error: 'Failed to create pending order.' }, { status: 500 });
        }

        // 4. Return the new Supabase UUID to the client
        return NextResponse.json({ order_uuid: data.order_uuid });

    } catch (error) {
        console.error("Order Creation Fatal Error:", error);
        return NextResponse.json({ error: 'Fatal error during order creation.' }, { status: 500 });
    }
}
