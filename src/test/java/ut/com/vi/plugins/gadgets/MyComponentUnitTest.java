package ut.com.vi.plugins.gadgets;

import org.junit.Test;
import com.vi.plugins.gadgets.MyPluginComponent;
import com.vi.plugins.gadgets.MyPluginComponentImpl;

import static org.junit.Assert.assertEquals;

public class MyComponentUnitTest
{
    @Test
    public void testMyName()
    {
        MyPluginComponent component = new MyPluginComponentImpl(null);
        assertEquals("names do not match!", "myComponent",component.getName());
    }
}