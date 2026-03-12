const pool = require('../config/db');

class ProductModel {
    static async findAll() {
        const result = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
        return result.rows;
    }

    static async findById(id) {
        const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
        return result.rows[0];
    }

    static async create({ name, price, stock, status = 'active' }) {
        const result = await pool.query(
            'INSERT INTO products (name, price, stock, status) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, price, stock, status]
        );
        return result.rows[0];
    }

    static async update(id, { name, price, stock, status }) {
        const result = await pool.query(
            'UPDATE products SET name = $1, price = $2, stock = $3, status = $4 WHERE id = $5 RETURNING *',
            [name, price, stock, status, id]
        );
        return result.rows[0];
    }

    static async delete(id) {
        const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
        return result.rows[0];
    }

    static async getRecommendations(productId, limit = 4) {
        // Collaborative Filtering: "Customers who bought this also bought..."
        const coPurchaseQuery = `
            SELECT 
                p.id, 
                p.name, 
                p.price, 
                p.category,
                p.stock,
                p.status,
                COUNT(ii2.product_id) as frequency
            FROM invoice_items ii1
            JOIN invoice_items ii2 ON ii1.invoice_id = ii2.invoice_id
            JOIN products p ON ii2.product_id = p.id
            WHERE ii1.product_id = $1 
              AND ii2.product_id <> $1
              AND (p.status ILIKE 'active' OR p.status ILIKE 'In Stock' OR p.status ILIKE 'in_stock')
            GROUP BY p.id, p.name, p.price, p.category, p.stock, p.status
            ORDER BY frequency DESC
            LIMIT $2
        `;

        try {
            const coPurchaseResult = await pool.query(coPurchaseQuery, [productId, limit]);
            let recommendations = coPurchaseResult.rows;

            const getExcludedIds = (recs) => [productId, ...recs.map(r => r.id)];

            // NEW: Keyword-based Cross-sell Logic (e.g. Keyboard -> Mouse)
            if (recommendations.length < limit) {
                const product = await this.findById(productId);
                if (product) {
                    const name = product.name.toLowerCase();
                    let searchKeyword = null;

                    if (name.includes('keyboard')) searchKeyword = 'mouse';
                    else if (name.includes('mouse')) searchKeyword = 'keyboard';
                    else if (name.includes('monitor')) searchKeyword = 'cable';
                    else if (name.includes('laptop')) searchKeyword = 'hub';

                    if (searchKeyword) {
                        const remainingLimit = limit - recommendations.length;
                        const excludedIds = getExcludedIds(recommendations);

                        // Strictly filter for items that are in stock
                        const keywordQuery = `
                            SELECT * FROM products 
                            WHERE name ILIKE $1 
                              AND id != ALL($2::uuid[])
                              AND status NOT ILIKE 'deleted'
                              AND status NOT ILIKE 'out_of_stock'
                              AND stock > 0
                            ORDER BY created_at DESC
                            LIMIT $3
                        `;
                        const keywordResult = await pool.query(keywordQuery, [`%${searchKeyword}%`, excludedIds, remainingLimit]);
                        recommendations = [...recommendations, ...keywordResult.rows];
                    }
                }
            }

            // Fallback 1: Same Category
            if (recommendations.length < limit) {
                const product = recommendations.length > 0 ? null : await this.findById(productId);
                const category = product?.category || (await this.findById(productId))?.category;

                if (category) {
                    const remainingLimit = limit - recommendations.length;
                    const excludedIds = getExcludedIds(recommendations);

                    const categoryQuery = `
                        SELECT * FROM products 
                        WHERE category = $1 
                          AND id != ALL($2::uuid[])
                          AND (status ILIKE 'active' OR status ILIKE 'In Stock' OR status ILIKE 'in_stock' OR status ILIKE 'low_stock')
                          AND status NOT ILIKE 'out_of_stock'
                          AND stock > 0
                        ORDER BY created_at DESC
                        LIMIT $3
                    `;
                    const categoryResult = await pool.query(categoryQuery, [category, excludedIds, remainingLimit]);
                    recommendations = [...recommendations, ...categoryResult.rows];
                }
            }

            // Final Fallback: If still not enough, fill with latest products
            if (recommendations.length < limit) {
                const remainingLimit = limit - recommendations.length;
                const excludedIds = getExcludedIds(recommendations);
                const generalQuery = `
                    SELECT * FROM products 
                    WHERE id != ALL($1::uuid[])
                      AND (status ILIKE 'active' OR status ILIKE 'In Stock' OR status ILIKE 'in_stock' OR status ILIKE 'low_stock')
                      AND status NOT ILIKE 'out_of_stock'
                      AND stock > 0
                    ORDER BY created_at DESC
                    LIMIT $2
                 `;
                const generalResult = await pool.query(generalQuery, [excludedIds, remainingLimit]);
                recommendations = [...recommendations, ...generalResult.rows];
            }

            return recommendations;
        } catch (error) {
            console.error('Error in getRecommendations model:', error);
            throw error; // Rethrow so the controller can handle it
        }
    }
}

module.exports = ProductModel;
