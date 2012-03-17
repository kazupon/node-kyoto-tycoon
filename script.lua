kt = __kyototycoon__

function debug(msg)
   kt.log('debug', msg)
end

function echo(inmap, outmap)
   for key, value in pairs(inmap) do
      debug(('key = %s, value = %s'):format(key, value))
      outmap[key] = value
   end
   return kt.RVSUCCESS
end
