// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Push Chain Configuration
const PUSH_CHAIN_RPC = 'https://rpc.push.org'
const NFT_CONTRACT_ADDRESS = Deno.env.get('NFT_CONTRACT_ADDRESS') || ''

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🔍 Starting Push Chain indexer...')

    // Get last processed block
    const { data: indexerState, error: stateError } = await supabaseClient
      .from('indexer_state')
      .select('*')
      .limit(1)
      .single()

    if (stateError && stateError.code !== 'PGRST116') {
      throw stateError
    }

    const lastBlock = indexerState?.last_processed_version || 0
    console.log(`📊 Last processed block: ${lastBlock}`)

    // Get current block number from Push Chain
    const blockResponse = await fetch(PUSH_CHAIN_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1
      })
    })

    if (!blockResponse.ok) {
      throw new Error(`Failed to fetch block number: ${blockResponse.statusText}`)
    }

    const blockData = await blockResponse.json()
    const currentBlock = parseInt(blockData.result, 16)
    console.log(`📦 Current block: ${currentBlock}`)

    // If no contract address configured, just update state
    if (!NFT_CONTRACT_ADDRESS) {
      console.log('⚠️ No NFT contract address configured, skipping event indexing')
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No contract configured',
          currentBlock
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get logs for GameNFTMinted events
    // Event signature: GameNFTMinted(uint256 indexed tokenId, address indexed player, uint256 score, uint256 maxCombo, uint256 tokensSlashed, string tierName)
    const eventSignature = '0x' + 'GameNFTMinted(uint256,address,uint256,uint256,uint256,string)'.split('').reduce((acc, char) => acc + char.charCodeAt(0).toString(16), '')
    
    const fromBlock = lastBlock > 0 ? `0x${lastBlock.toString(16)}` : '0x0'
    const toBlock = `0x${currentBlock.toString(16)}`

    const logsResponse = await fetch(PUSH_CHAIN_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getLogs',
        params: [{
          address: NFT_CONTRACT_ADDRESS,
          fromBlock,
          toBlock,
          topics: [] // Get all events from contract
        }],
        id: 2
      })
    })

    if (!logsResponse.ok) {
      throw new Error(`Failed to fetch logs: ${logsResponse.statusText}`)
    }

    const logsData = await logsResponse.json()
    const logs = logsData.result || []
    console.log(`📝 Found ${logs.length} events`)

    let processedCount = 0

    for (const log of logs) {
      try {
        // Parse event data
        const tokenId = parseInt(log.topics[1], 16)
        const playerAddress = '0x' + log.topics[2].slice(26)
        
        // Log event to database
        await supabaseClient
          .from('event_log')
          .insert({
            event_type: 'GameNFTMinted',
            game_id: tokenId,
            player_address: playerAddress,
            data: {
              tokenId,
              playerAddress,
              blockNumber: parseInt(log.blockNumber, 16),
              transactionHash: log.transactionHash
            },
            transaction_hash: log.transactionHash,
            transaction_version: parseInt(log.blockNumber, 16)
          })

        processedCount++
      } catch (err) {
        console.error('Error processing log:', err)
      }
    }

    // Update last processed block
    if (indexerState) {
      await supabaseClient
        .from('indexer_state')
        .update({ 
          last_processed_version: currentBlock,
          last_sync_at: new Date().toISOString()
        })
        .eq('id', indexerState.id)
    } else {
      await supabaseClient
        .from('indexer_state')
        .insert({
          last_processed_version: currentBlock,
          last_sync_at: new Date().toISOString()
        })
    }

    console.log(`✅ Indexed ${processedCount} events, current block: ${currentBlock}`)

    return new Response(
      JSON.stringify({
        success: true,
        processed: processedCount,
        lastBlock: currentBlock
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ Indexer error:', errorMessage)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
