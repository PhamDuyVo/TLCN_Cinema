import asyncio
from pathlib import Path
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
async def main():
 async with stdio_client(StdioServerParameters(command='C:/Users/Admin/.local/bin/uvx.exe',args=['mcp-for-blender'])) as (r,w):
  async with ClientSession(r,w) as session:
   await session.initialize()
   result=await session.call_tool('execute_blender_code', {'code':Path(__file__).with_name('build_cinema_assets.py').read_text(), 'user_prompt':'Create cinema seat assets in a separate scene and export GLB without modifying existing scene.'})
   print(result)
asyncio.run(main())
