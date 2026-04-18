import asyncio
import time
from data_loader import DualSourceDataLoader

async def test():
    loader = DualSourceDataLoader()
    start = time.time()
    print("Loading combined data (day)...")
    df = await loader.load_combined_data('day')
    end = time.time()
    
    print(f"Fetch completed in {end - start:.2f} seconds")
    print(f"Total events: {len(df)}")
    
    if len(df) > 0:
        latest = df['time'].max()
        print(f"Latest earthquake in dataset: {latest} (UTC)")
        print(f"Latest earthquake source: {df.loc[df['time'] == latest, 'source'].values[0]}")
    else:
        print("No data returned!")

if __name__ == "__main__":
    asyncio.run(test())
