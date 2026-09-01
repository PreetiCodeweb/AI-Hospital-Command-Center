-- Create bed_orders table
CREATE TABLE IF NOT EXISTS bed_orders (
    order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(user_id) ON DELETE CASCADE,
    bed_id UUID NOT NULL REFERENCES beds(bed_id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(department_id) ON DELETE CASCADE,
    order_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(30) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bed_orders_user_id ON bed_orders(user_id);
CREATE INDEX idx_bed_orders_bed_id ON bed_orders(bed_id);
CREATE INDEX idx_bed_orders_department_id ON bed_orders(department_id);
CREATE INDEX idx_bed_orders_status ON bed_orders(status);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(user_id) ON DELETE CASCADE,
    bed_order_id UUID REFERENCES bed_orders(order_id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    review_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_bed_order_id ON reviews(bed_order_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
