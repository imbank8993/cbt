import { BookOpen, Users, Star, MessageCircle } from 'lucide-react';
import React from 'react';
import { supabase } from './supabase';

export interface LayananItem {
    id: string;
    title: string;
    description: string;
    icon_name: string;
}

export interface TestimoniItem {
    id: string;
    user_name: string;
    user_role: string;
    content: string;
    avatar_url: string;
}

export interface PricelistItem {
    id: string;
    name: string;
    price: number;
    period: string;
    features: string[];
    is_popular: boolean;
}

// Helper to get Icon by name
export const getIcon = (name: string, size = 28) => {
    switch (name) {
        case 'BookOpen': return <BookOpen className="text-unelma-orange" size={size} />;
        case 'Users': return <Users className="text-unelma-orange" size={size} />;
        case 'Star': return <Star className="text-unelma-orange" size={size} />;
        case 'MessageCircle': return <MessageCircle className="text-unelma-orange" size={size} />;
        default: return <BookOpen className="text-unelma-orange" size={size} />;
    }
};

// --- LAYANAN CRUD ---

export const fetchLayanan = async () => {
    const { data, error } = await supabase
        .from('unelma_layanan')
        .select('*')
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching Layanan:', error);
        return [];
    }
    return data as LayananItem[];
};

export const saveLayanan = async (item: Omit<LayananItem, 'id'>) => {
    const { data, error } = await supabase.from('unelma_layanan').insert([item]).select();
    if (error) throw error;
    return data[0] as LayananItem;
};

export const updateLayanan = async (id: string, item: Partial<LayananItem>) => {
    const { data, error } = await supabase.from('unelma_layanan').update(item).eq('id', id).select();
    if (error) throw error;
    return data[0] as LayananItem;
};

export const deleteLayanan = async (id: string) => {
    const { error } = await supabase.from('unelma_layanan').delete().eq('id', id);
    if (error) throw error;
};

// --- TESTIMONI CRUD ---

export const fetchTestimoni = async () => {
    const { data, error } = await supabase
        .from('unelma_testimoni')
        .select('*')
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching Testimoni:', error);
        return [];
    }
    return data as TestimoniItem[];
};

// --- PRICELIST CRUD ---

export const fetchPricelist = async () => {
    const { data, error } = await supabase
        .from('unelma_pricelist')
        .select('*')
        .order('price', { ascending: true });

    if (error) {
        console.error('Error fetching Pricelist:', error);
        return [];
    }
    return data as PricelistItem[];
};

export const savePricelist = async (item: Omit<PricelistItem, 'id'>) => {
    const { data, error } = await supabase.from('unelma_pricelist').insert([item]).select();
    if (error) throw error;
    return data[0] as PricelistItem;
};

export const updatePricelist = async (id: string, item: Partial<PricelistItem>) => {
    const { data, error } = await supabase.from('unelma_pricelist').update(item).eq('id', id).select();
    if (error) throw error;
    return data[0] as PricelistItem;
};

export const deletePricelist = async (id: string) => {
    const { error } = await supabase.from('unelma_pricelist').delete().eq('id', id);
    if (error) throw error;
};
