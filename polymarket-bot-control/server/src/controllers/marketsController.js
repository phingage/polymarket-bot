const { MongoClient } = require('mongodb');

class MarketsController {
  constructor() {
    this.db = null;
  }

  setDatabase(db) {
    this.db = db;
  }

  /**
   * Get markets with server-side pagination and filtering
   * Query parameters:
   * - page: page number (default: 1)
   * - limit: items per page (default: 50, max: 100)
   * - search: search term for question/slug
   * - status: filter by status (active, closed, archived)
   * - sortBy: field to sort by (reward, volume, liquidity, minSize, maxSpread, endDate, question)
   * - sortOrder: asc or desc (default: desc)
   */
  async getMarkets(req, res) {
    try {
      if (!this.db) {
        return res.status(500).json({ error: 'Database not connected' });
      }

      // Parse query parameters with defaults
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
      const search = req.query.search || '';
      const status = req.query.status || 'all';
      const sortBy = req.query.sortBy || 'reward';
      const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

      const collection = this.db.collection(process.env.MONGO_COLLECTION || 'markets');
      
      // Build MongoDB query
      const query = {
        clobRewards: { $exists: true, $ne: [] }
      };

      // Add search filter
      if (search) {
        query.$or = [
          { question: { $regex: search, $options: 'i' } },
          { slug: { $regex: search, $options: 'i' } }
        ];
      }

      // Add status filter
      if (status !== 'all') {
        switch (status) {
          case 'active':
            query.active = true;
            break;
          case 'closed':
            query.closed = true;
            break;
          case 'archived':
            query.archived = true;
            break;
        }
      }

      // Build sort object
      const sort = {};
      switch (sortBy) {
        case 'question':
          sort.question = sortOrder;
          break;
        case 'volume':
          sort.volumeNum = sortOrder;
          break;
        case 'liquidity':
          sort.liquidityNum = sortOrder;
          break;
        case 'minSize':
          sort.rewardsMinSize = sortOrder;
          break;
        case 'maxSpread':
          sort.rewardsMaxSpread = sortOrder;
          break;
        case 'endDate':
          sort.endDate = sortOrder;
          break;
        case 'reward':
        default:
          sort['clobRewards.0.rewardsDailyRate'] = sortOrder;
          break;
      }

      // Get total count for pagination
      const totalCount = await collection.countDocuments(query);
      
      // Get paginated results
      const markets = await collection
        .find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray();

      console.log(`Retrieved ${markets.length} markets (page ${page}/${Math.ceil(totalCount / limit)})`);

      // Transform data for the frontend
      const formattedMarkets = markets.map(market => ({
        id: market.id || market._id.toString(),
        question: market.question || 'N/A',
        reward: market.clobRewards && market.clobRewards[0] ? 
          (market.clobRewards[0].rewardsDailyRate || '0') : '0',
        minSize: market.rewardsMinSize || '0',
        maxSpread: market.rewardsMaxSpread || '0',
        spread: market.spread || '0',
        endDate: market.endDate || new Date().toISOString(),
        volume: market.volumeNum || '0',
        liquidity: market.liquidityNum || '0',
        active: market.active || false,
        closed: market.closed || false,
        archived: market.archived || false,
        slug: market.slug || '',
        description: market.description || '',
        outcomes: market.outcomes || [],
        outcomePrices: market.outcomePrices || []
      }));

      // Return paginated response
      res.json({
        data: formattedMarkets,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNext: page < Math.ceil(totalCount / limit),
          hasPrev: page > 1
        },
        filters: {
          search,
          status,
          sortBy,
          sortOrder: sortOrder === 1 ? 'asc' : 'desc'
        }
      });

    } catch (error) {
      console.error('Error in getMarkets:', error);
      res.status(500).json({ 
        error: 'Internal server error', 
        message: error.message 
      });
    }
  }

  /**
   * Get top markets by reward (for homepage widget)
   */
  async getTopMarkets(req, res) {
    try {
      if (!this.db) {
        return res.status(500).json({ error: 'Database not connected' });
      }

      const limit = Math.min(20, Math.max(1, parseInt(req.query.limit) || 10));
      const collection = this.db.collection(process.env.MONGO_COLLECTION || 'markets');
      
      const markets = await collection
        .find({
          clobRewards: { $exists: true, $ne: [] },
          active: true // Solo mercati attivi per la homepage
        })
        .sort({ 'clobRewards.0.rewardsDailyRate': -1 })
        .limit(limit)
        .toArray();

      const formattedMarkets = markets.map(market => ({
        id: market.id || market._id.toString(),
        question: market.question || 'N/A',
        reward: market.clobRewards && market.clobRewards[0] ? 
          (market.clobRewards[0].rewardsDailyRate || '0') : '0',
        active: market.active || false,
        closed: market.closed || false,
        archived: market.archived || false,
        slug: market.slug || ''
      }));

      res.json(formattedMarkets);

    } catch (error) {
      console.error('Error in getTopMarkets:', error);
      res.status(500).json({ 
        error: 'Internal server error', 
        message: error.message 
      });
    }
  }

  /**
   * Get markets statistics
   */
  async getMarketsStats(req, res) {
    try {
      if (!this.db) {
        return res.status(500).json({ error: 'Database not connected' });
      }

      const collection = this.db.collection(process.env.MONGO_COLLECTION || 'markets');
      
      const stats = await Promise.all([
        collection.countDocuments({}),
        collection.countDocuments({ active: true }),
        collection.countDocuments({ closed: true }),
        collection.countDocuments({ archived: true }),
        collection.countDocuments({ clobRewards: { $exists: true, $ne: [] } })
      ]);
      
      res.json({
        total: stats[0],
        active: stats[1],
        closed: stats[2],
        archived: stats[3],
        withRewards: stats[4]
      });

    } catch (error) {
      console.error('Error in getMarketsStats:', error);
      res.status(500).json({ 
        error: 'Internal server error', 
        message: error.message 
      });
    }
  }
}

module.exports = new MarketsController();