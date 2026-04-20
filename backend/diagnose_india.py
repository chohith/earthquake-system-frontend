import asyncio
import time
from data_loader import DualSourceDataLoader

async def test():
    loader = DualSourceDataLoader()
    start = time.time()
    print("Loading combined data (month)...")
    df = await loader.load_combined_data('month')
    end = time.time()
    
    print(f"Fetch completed in {end - start:.2f} seconds")
    print(f"Total events: {len(df)}")
    
    if not df.empty:
        # Check for India events
        # Our updated logic in data_loader.py: 
        # is_in_india = (df['latitude'] >= 6) & (df['latitude'] <= 38) & (df['longitude'] >= 68) & (df['longitude'] <= 98)
        india_events = df[df['place'].str.contains('India', case=False) | (df['source'] == 'riseq')]
        print(f"Total India-related events: {len(india_events)}")
        
        if len(india_events) > 0:
            print("\nRecent India Events:")
            print(india_events[['time', 'place', 'magnitude', 'source']].head(5))
        else:
            print("\nNo India-related events found in the 'month' window.")
            
        print(f"\nLatest earthquake in dataset: {df['time'].max()} (UTC)")
    else:
        print("No data returned at all!")

if __name__ == "__main__":
    asyncio.run(test())
