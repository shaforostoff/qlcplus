#pragma once

#include <boost/container/flat_map.hpp>


template<class Key, class T>
struct FlatMap: public boost::container::flat_map<Key, T>
{
    using Base = boost::container::flat_map<Key, T>;
    T value(Key key, T defValue) const
    {
        auto it = Base::find(key);
        return it == Base::end() ? defValue : it->second;
    }
    void remove(Key key)
	{
		Base::erase(key);
	}
};
