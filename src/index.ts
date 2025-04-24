import type { FastifyInstance, FastifySchema, FastifyPluginCallback } from 'fastify'
import { createAccelerator } from 'json-accelerator'
import fp from 'fastify-plugin'

function generateCacheKey (schema: FastifySchema) {
    return JSON.stringify(schema, Object.keys(schema || {}).sort());
};

const acceleratorCache = new Map();

function getOrCreateAccelerator (schema: FastifySchema) {
    const cacheKey = generateCacheKey(schema);
    
    if (acceleratorCache.has(cacheKey)) {
        return acceleratorCache.get(cacheKey);
    }
    
    const accelerator = createAccelerator(schema.response);
    
    acceleratorCache.set(cacheKey, accelerator);
    
    return accelerator;
};

const fastifyJsonAccelerator: FastifyPluginCallback = (
    fastify: FastifyInstance, 
    _,
    done
  ) => {
  fastify.setSerializerCompiler(({ schema, /*method, url, httpStatus*/ }) => {
    const stringifier = getOrCreateAccelerator(schema);
    
    // Return the serializer function
    return data => stringifier(data);
  })

  done()
}

export default fp(fastifyJsonAccelerator, {
  fastify: '5.x',
  name: 'fastify-json-accelerator'
});