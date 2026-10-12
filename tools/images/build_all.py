import sys, os
sys.path.insert(0, os.path.dirname(__file__))
import unit1
unit1.build()
for mod in ("unit2", "unit3", "unit4"):
    if os.path.exists(os.path.join(os.path.dirname(__file__), mod + ".py")):
        __import__(mod).build()
print("images written to site/images")
